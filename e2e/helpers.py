import sys

sys.dont_write_bytecode = True

import json
import math
import os
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Dict, Iterable, List, Optional, Tuple
from urllib.parse import urljoin, urlparse

from playwright.sync_api import Browser, BrowserContext, Locator, Page, Response


E2E_DIR = Path(__file__).resolve().parent
REPO_ROOT = E2E_DIR.parent
BASELINE_PATH = E2E_DIR / "ref_baseline.json"

DESKTOP_VIEWPORT = {"width": 1440, "height": 900}
MOBILE_VIEWPORT = {"width": 390, "height": 844}


def parse_viewport(viewport: str) -> Dict[str, int]:
    if viewport == "1440x900":
        return dict(DESKTOP_VIEWPORT)
    if viewport == "390x844":
        return dict(MOBILE_VIEWPORT)
    m = re.match(r"^(\d+)x(\d+)$", viewport.strip())
    if not m:
        raise ValueError(f"Unsupported viewport spec: {viewport!r}")
    return {"width": int(m.group(1)), "height": int(m.group(2))}


def load_baseline() -> Dict[str, Any]:
    with BASELINE_PATH.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def _strip_ts_comments(source: str) -> str:
    """Strip // line comments and /* ... */ block comments while preserving string literals."""
    token_re = re.compile(
        r'"(?:\\.|[^"\\])*"'
        r"|'(?:\\.|[^'\\])*'"
        r"|`(?:\\.|[^`\\])*`"
        r"|//[^\n]*"
        r"|/\*[\s\S]*?\*/"
    )
    return token_re.sub(
        lambda m: "" if m.group(0).startswith(("//", "/*")) else m.group(0),
        source,
    )


def load_brand_config(repo_root: Path = REPO_ROOT) -> Dict[str, str]:
    brand_file = Path(repo_root) / "src" / "config" / "brand.ts"
    if not brand_file.exists():
        raise FileNotFoundError(f"Missing brand config: {brand_file}")
    raw = _strip_ts_comments(brand_file.read_text(encoding="utf-8"))
    # Match flat string literal properties `key: "value"` or `key: 'value'` (single or multi-line)
    pattern = re.compile(
        r"""(\w+)\s*:\s*\n?\s*(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)')""",
        re.MULTILINE,
    )
    result: Dict[str, str] = {}
    for match in pattern.finditer(raw):
        key = match.group(1)
        val = match.group(2) if match.group(2) is not None else match.group(3)
        result[key] = val
    required = [
        "name",
        "shortName",
        "subName",
        "monogram",
        "domain",
        "hotline",
        "hotlineRaw",
        "email",
        "zaloUrl",
        "messengerUrl",
        "tiktokUrl",
        "shopeeUrl",
        "address",
        "hours",
        "mapEmbedUrl",
    ]
    missing = [k for k in required if k not in result]
    if missing:
        raise ValueError(f"brand.ts missing expected keys: {missing}")
    return result


@dataclass
class RunConfig:
    base_url: str
    screenshots_dir: Path
    live_ref: bool = False
    headed: bool = False
    brand: Dict[str, str] = field(default_factory=load_brand_config)
    baseline: Dict[str, Any] = field(default_factory=load_baseline)
    extra_artifacts: Dict[str, Any] = field(default_factory=dict)


@dataclass
class TestSpec:
    test_id: str
    tier: int
    features: Tuple[str, ...]
    viewport: str
    title: str
    fn: Callable[[Browser, RunConfig], None]


TEST_REGISTRY: List[TestSpec] = []


def test_case(
    test_id: str,
    tier: int,
    features: Iterable[str],
    viewport: str = "1440x900",
    title: str = "",
):
    def decorator(fn: Callable[[Browser, RunConfig], None]):
        spec = TestSpec(
            test_id=test_id,
            tier=tier,
            features=tuple(features),
            viewport=viewport,
            title=title or fn.__name__,
            fn=fn,
        )
        TEST_REGISTRY.append(spec)
        return fn

    return decorator


class ConsoleGuard:
    """Tracks console errors, page errors, failed requests, HTTP >= 400, and nhuydecor.vn leaks."""

    def __init__(self, base_url: str, expect_404: bool = False):
        self.base_url = base_url.rstrip("/")
        self.base_host = urlparse(self.base_url).netloc
        self.expect_404 = expect_404
        self.console_errors: List[str] = []
        self.page_errors: List[str] = []
        self.request_failures: List[str] = []
        self.http_errors: List[str] = []
        self.forbidden_requests: List[str] = []
        self._attached = False

    def attach(self, page: Page) -> None:
        if self._attached:
            return
        self._attached = True

        def on_console(msg):
            if msg.type == "error":
                text = msg.text or ""
                # Ignore external map iframe network errors if sandbox/offline blocks OSM
                if "openstreetmap" in text.lower():
                    return
                if self.expect_404 and "404" in text:
                    return
                self.console_errors.append(text)

        def on_pageerror(err):
            self.page_errors.append(str(err))

        def on_request(req):
            u = req.url.lower()
            if "nhuydecor" in u:
                self.forbidden_requests.append(req.url)

        def on_request_failed(req):
            u = req.url
            failure = req.failure or "failed"
            if "nhuydecor" in u.lower():
                self.forbidden_requests.append(u)
            # Ignore aborted requests from rapid route transitions or external OSM tiles
            if "ERR_ABORTED" in str(failure):
                return
            if "openstreetmap" in u.lower():
                return
            self.request_failures.append(f"{u} ({failure})")

        def on_response(resp: Response):
            u = resp.url
            if "nhuydecor" in u.lower():
                self.forbidden_requests.append(u)
            status = resp.status
            if status >= 400:
                if self.expect_404 and status == 404 and resp.request.resource_type == "document":
                    return
                parsed = urlparse(u)
                if parsed.netloc == self.base_host or "/images/" in u:
                    self.http_errors.append(f"{status} {u}")

        page.on("console", on_console)
        page.on("pageerror", on_pageerror)
        page.on("request", on_request)
        page.on("requestfailed", on_request_failed)
        page.on("response", on_response)

    def reset(self) -> None:
        self.console_errors.clear()
        self.page_errors.clear()
        self.request_failures.clear()
        self.http_errors.clear()
        self.forbidden_requests.clear()

    def assert_clean(self, label: str = "") -> None:
        issues = []
        if self.forbidden_requests:
            issues.append(f"forbidden nhuydecor requests: {self.forbidden_requests[:5]}")
        if self.page_errors:
            issues.append(f"pageerror: {self.page_errors[:5]}")
        if self.console_errors:
            issues.append(f"console.error: {self.console_errors[:5]}")
        if self.request_failures:
            issues.append(f"requestfailed: {self.request_failures[:5]}")
        if self.http_errors:
            issues.append(f"http>=400: {self.http_errors[:5]}")
        if issues:
            prefix = f"[{label}] " if label else ""
            raise AssertionError(prefix + " | ".join(issues))


def open_page(
    browser: Browser,
    base_url: str,
    viewport: str = "1440x900",
    skip_splash: bool = True,
    reduced_motion: bool = False,
    expect_404: bool = False,
) -> Tuple[BrowserContext, Page, ConsoleGuard]:
    vp = parse_viewport(viewport)
    context_kwargs: Dict[str, Any] = {
        "viewport": vp,
        "locale": "vi-VN",
    }
    if reduced_motion:
        context_kwargs["reduced_motion"] = "reduce"
    context = browser.new_context(**context_kwargs)
    if skip_splash:
        context.add_init_script("window.sessionStorage.setItem('ag_splash_done', '1');")
    page = context.new_page()
    page.set_default_timeout(5000)
    guard = ConsoleGuard(base_url=base_url, expect_404=expect_404)
    guard.attach(page)
    return context, page, guard


def wait_for_splash_clear(page: Page, timeout_ms: int = 6000) -> None:
    page.wait_for_function(
        """() => {
            if (document.documentElement.getAttribute('data-splash') === 'off') {
                const el = document.querySelector('.ny-splash');
                if (!el) return true;
            }
            const el = document.querySelector('.ny-splash');
            if (!el) return true;
            const st = getComputedStyle(el);
            return st.display === 'none' || st.visibility === 'hidden' || st.opacity === '0' || el.getAttribute('data-splash') === 'off';
        }""",
        timeout=timeout_ms,
    )


def goto_ready(
    page: Page,
    url: str,
    skip_splash: bool = True,
    wait_network: bool = False,
) -> Optional[Response]:
    resp = page.goto(url, wait_until="domcontentloaded", timeout=15000)
    try:
        page.wait_for_load_state("load", timeout=2500)
    except Exception:
        pass
    if wait_network:
        try:
            page.wait_for_load_state("networkidle", timeout=2500)
        except Exception:
            pass
    if skip_splash:
        wait_for_splash_clear(page, timeout_ms=5000)
    page.wait_for_timeout(150)
    return resp


def open_auth_modal(page: Page, tab: str = "login") -> Locator:
    """Open .auth-dialog (desktop or mobile drawer), wait for setTimeout(0) reset to settle, and select tab."""
    acct = page.locator(
        '.v2-header button[aria-label*="Đăng nhập" i]:visible, '
        '.v2-header button[aria-label*="Tài khoản" i]:visible'
    )
    if acct.count() > 0:
        acct.first.click()
    else:
        burger = page.locator(".v2-burger, .v2-header button[aria-label*='menu' i]:visible").first
        burger.click()
        drawer = page.locator(".v2-mobile-menu")
        drawer.wait_for(state="visible", timeout=4000)
        drawer.locator("button", has_text="Đăng nhập").first.click()
    dlg = page.locator(".auth-dialog")
    dlg.wait_for(state="visible", timeout=4000)
    # Wait for AuthModal useEffect setTimeout(..., 0) state reset before interacting/filling
    page.wait_for_timeout(120)
    if tab == "register":
        reg_tab = dlg.locator("button", has_text="Đăng ký").first
        if reg_tab.get_attribute("aria-selected") != "true":
            reg_tab.click()
            page.wait_for_timeout(60)
    elif tab == "login":
        login_tab = dlg.locator("button", has_text="Đăng nhập").first
        if login_tab.count() > 0 and login_tab.get_attribute("aria-selected") != "true":
            login_tab.click()
            page.wait_for_timeout(60)
    return dlg


def scroll_and_reveal(page: Page, step_px: int = 550, pause_ms: int = 90) -> None:
    total_h = page.evaluate("() => Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)")
    y = 0
    while y < total_h:
        page.evaluate(f"window.scrollTo(0, {y})")
        page.wait_for_timeout(pause_ms)
        y += step_px
        total_h = page.evaluate("() => Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)")
    page.evaluate("window.scrollTo(0, document.documentElement.scrollHeight)")
    page.wait_for_timeout(850)


def assert_no_horizontal_overflow(page: Page, label: str = "") -> None:
    metrics = page.evaluate(
        "() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth })"
    )
    sw = metrics["scrollWidth"]
    iw = metrics["innerWidth"]
    if sw > iw:
        prefix = f"[{label}] " if label else ""
        raise AssertionError(f"{prefix}Horizontal overflow detected: scrollWidth={sw} > innerWidth={iw}")


def assert_all_images_loaded(page: Page, label: str = "") -> int:
    imgs = page.evaluate(
        """() => Array.from(document.querySelectorAll('img')).map(img => {
            let hidden = false;
            let cur = img;
            while (cur && cur.nodeType === 1) {
                const st = getComputedStyle(cur);
                if (st.display === 'none' || st.visibility === 'hidden') {
                    hidden = true;
                    break;
                }
                cur = cur.parentElement;
            }
            const visible = !hidden;
            return {
                src: img.getAttribute('src') || '',
                currentSrc: img.currentSrc || '',
                complete: img.complete,
                naturalWidth: img.naturalWidth,
                visible: visible
            };
        })"""
    )
    broken = []
    forbidden = []
    for info in imgs:
        src = (info["currentSrc"] or info["src"] or "").lower()
        if "nhuydecor" in src:
            forbidden.append(src)
        if info["visible"] and (not info["complete"] or info["naturalWidth"] <= 0):
            broken.append(info["src"] or info["currentSrc"])
    prefix = f"[{label}] " if label else ""
    if forbidden:
        raise AssertionError(f"{prefix}Forbidden nhuydecor image URLs: {forbidden}")
    if broken:
        raise AssertionError(f"{prefix}Broken visible images (naturalWidth<=0): {broken[:8]}")
    return len(imgs)


def verify_video_ready_slot(
    page: Page,
    locator: Locator,
    expected_aspect: float,
    tolerance: float = 0.22,
    check_scrim: bool = True,
) -> Dict[str, Any]:
    count = locator.count()
    assert count > 0, "Video ready-slot container not found"
    box = locator.first.bounding_box()
    assert box is not None and box["width"] > 20 and box["height"] > 20, f"Video slot has invalid bounding box: {box}"
    actual_aspect = box["width"] / box["height"]
    rel_diff = abs(actual_aspect - expected_aspect) / expected_aspect
    assert rel_diff <= tolerance, (
        f"Video slot aspect ratio mismatch: actual={actual_aspect:.3f} ({box['width']:.1f}x{box['height']:.1f}), "
        f"expected={expected_aspect:.3f} (diff={rel_diff:.2%} > {tolerance:.0%})"
    )

    info = locator.first.evaluate(
        """el => {
            const video = el.tagName.toLowerCase() === 'video' ? el : el.querySelector('video');
            const img = el.tagName.toLowerCase() === 'img' ? el : el.querySelector('img');
            const beforeBg = getComputedStyle(el, '::before').backgroundImage;
            const afterBg = getComputedStyle(el, '::after').backgroundImage;
            const beforeBgCol = getComputedStyle(el, '::before').backgroundColor;
            const afterBgCol = getComputedStyle(el, '::after').backgroundColor;
            const elRect = el.getBoundingClientRect();
            const namedOverlay = el.querySelector('[class*="scrim"], [class*="overlay"], .bg-gradient-to-t, .bg-gradient-to-b');
            const fullOverlay = namedOverlay || Array.from(el.querySelectorAll('div')).find(d => {
                const dst = getComputedStyle(d);
                if (dst.position !== 'absolute') return false;
                const dr = d.getBoundingClientRect();
                if (dr.width < elRect.width * 0.5 || dr.height < elRect.height * 0.5) return false;
                const hasBgImg = dst.backgroundImage && dst.backgroundImage !== 'none';
                const hasBgCol = dst.backgroundColor && dst.backgroundColor !== 'rgba(0, 0, 0, 0)' && dst.backgroundColor !== 'transparent';
                return hasBgImg || hasBgCol;
            });
            const hasScrim = Boolean(
                (beforeBg && beforeBg !== 'none') ||
                (afterBg && afterBg !== 'none') ||
                (beforeBgCol && beforeBgCol !== 'rgba(0, 0, 0, 0)') ||
                (afterBgCol && afterBgCol !== 'rgba(0, 0, 0, 0)') ||
                fullOverlay
            );
            return {
                hasVideo: Boolean(video),
                poster: video ? (video.getAttribute('poster') || '') : '',
                videoSrc: video ? (video.currentSrc || video.getAttribute('src') || (video.querySelector('source') ? video.querySelector('source').getAttribute('src') : '') || '') : '',
                videoError: video ? video.error : null,
                hasImg: Boolean(img),
                imgSrc: img ? (img.currentSrc || img.getAttribute('src') || '') : '',
                imgComplete: img ? img.complete : false,
                imgNaturalWidth: img ? img.naturalWidth : 0,
                hasScrim: hasScrim
            };
        }"""
    )

    assert info["hasVideo"] or info["hasImg"], "Video ready-slot must contain a <video poster=...> or fallback poster <img>"

    if info["hasVideo"]:
        assert info["poster"], "Video element must have non-empty poster attribute"
        assert "nhuydecor" not in info["poster"].lower(), f"Forbidden nhuydecor poster URL: {info['poster']}"
        assert info["videoError"] is None, f"Video element reported media error: {info['videoError']}"
        poster_abs = urljoin(page.url, info["poster"])
        resp = page.request.get(poster_abs)
        assert resp.status == 200, f"Video poster HTTP {resp.status}: {poster_abs}"
        ctype = (resp.headers.get("content-type") or "").lower()
        assert ctype.startswith("image/"), f"Video poster non-image content-type {ctype}: {poster_abs}"
        if info["videoSrc"]:
            v_abs = urljoin(page.url, info["videoSrc"])
            v_resp = page.request.get(v_abs)
            assert v_resp.status == 200, f"Video source HTTP {v_resp.status}: {v_abs}"
    else:
        assert info["imgSrc"], "Fallback poster <img> missing src"
        assert "nhuydecor" not in info["imgSrc"].lower(), f"Forbidden nhuydecor img URL: {info['imgSrc']}"
        assert info["imgComplete"] and info["imgNaturalWidth"] > 0, (
            f"Poster fallback <img> failed to load: {info['imgSrc']}"
        )

    if check_scrim:
        assert info["hasScrim"], "Expected scrim or overlay styling on video slot"

    return info


def inspect_channel_links(page: Page, container_selector: str) -> Dict[str, Dict[str, Any]]:
    data = page.evaluate(
        """(sel) => {
            const root = document.querySelector(sel);
            if (!root) return { found: false, items: [] };
            const anchors = Array.from(root.querySelectorAll('a[href]'));
            const items = anchors.map(a => {
                const href = a.getAttribute('href') || '';
                const svg = a.querySelector('svg');
                let svgRect = { width: 0, height: 0 };
                let shapes = 0;
                if (svg) {
                    const r = svg.getBoundingClientRect();
                    svgRect = { width: r.width, height: r.height };
                    shapes = svg.querySelectorAll('path, circle, rect, polygon, polyline, line').length;
                }
                const aRect = a.getBoundingClientRect();
                return {
                    href,
                    target: a.getAttribute('target') || '',
                    rel: a.getAttribute('rel') || '',
                    text: (a.innerText || a.getAttribute('aria-label') || '').trim(),
                    hasSvg: Boolean(svg),
                    svgW: svgRect.width,
                    svgH: svgRect.height,
                    svgShapes: shapes,
                    visible: aRect.width > 0 && aRect.height > 0
                };
            });
            return { found: true, items };
        }""",
        container_selector,
    )
    assert data["found"], f"Container not found for channel inspection: {container_selector}"
    mapped: Dict[str, Dict[str, Any]] = {}
    for item in data["items"]:
        href_l = item["href"].lower()
        text_l = item["text"].lower()
        if "shopee" in href_l or "shopee" in text_l:
            mapped["shopee"] = item
        elif "zalo.me" in href_l or "zalo" in text_l:
            mapped["zalo"] = item
        elif "m.me" in href_l or "messenger" in href_l or "messenger" in text_l:
            mapped["messenger"] = item
        elif href_l.startswith("tel:"):
            # Prefer channel phone link with SVG or explicit hotline label when multiple tel links exist
            if "phone" not in mapped or item["hasSvg"]:
                mapped["phone"] = item
    return mapped


def assert_channel_links_complete(
    page: Page,
    container_selector: str,
    brand: Dict[str, str],
    require_channels: Tuple[str, ...] = ("shopee", "zalo", "messenger", "phone"),
    require_svg: bool = True,
) -> Dict[str, Dict[str, Any]]:
    mapped = inspect_channel_links(page, container_selector)
    expected_hrefs = {
        "shopee": brand["shopeeUrl"],
        "zalo": brand["zaloUrl"],
        "messenger": brand["messengerUrl"],
        "phone": f"tel:{brand['hotlineRaw']}",
    }
    for ch in require_channels:
        assert ch in mapped, f"Missing '{ch}' channel <a> inside {container_selector}. Found: {list(mapped.keys())}"
        item = mapped[ch]
        assert item["href"] == expected_hrefs[ch], (
            f"Channel '{ch}' href mismatch in {container_selector}: got {item['href']!r}, expected {expected_hrefs[ch]!r}"
        )
        assert "nhuydecor" not in item["href"].lower(), f"Forbidden nhuydecor href in {ch}: {item['href']}"
        if ch == "phone":
            assert item["href"].startswith("tel:"), f"Phone link must use tel:, got {item['href']}"
        else:
            assert item["target"] == "_blank", f"External channel '{ch}' in {container_selector} must have target='_blank'"
            rel_tokens = set(item["rel"].lower().split())
            assert "noopener" in rel_tokens and "noreferrer" in rel_tokens, (
                f"External channel '{ch}' in {container_selector} must have rel containing 'noopener noreferrer', got {item['rel']!r}"
            )
        if require_svg:
            assert item["hasSvg"], f"Channel '{ch}' in {container_selector} must contain an inline <svg> icon"
            assert item["svgW"] >= 14 and item["svgH"] >= 14, (
                f"Channel '{ch}' SVG in {container_selector} too small: {item['svgW']}x{item['svgH']}"
            )
            assert item["svgShapes"] > 0, f"Channel '{ch}' SVG in {container_selector} has no vector shapes"
    return mapped


def discover_category_urls(page: Page, base_url: str) -> List[str]:
    goto_ready(page, f"{base_url}/")
    btn = page.locator(".v2-header button:visible", has_text="Sản phẩm").first
    btn.click()
    page.wait_for_selector(".v2-mega", timeout=5000)
    urls: List[str] = []
    # Collect links across rooms
    rooms = page.locator(".v2-mega-rooms li button")
    room_count = rooms.count()
    for idx in range(min(room_count, 50)):
        rooms.nth(idx).click()
        page.wait_for_timeout(30)
        hrefs = page.eval_on_selector_all(
            '.v2-mega-items a[href^="/danh-muc/"]',
            "els => els.map(e => e.getAttribute('href')).filter(Boolean)",
        )
        for h in hrefs:
            if h not in urls and h != "/danh-muc/tat-ca":
                urls.append(h)
    close_btn = page.locator(".v2-mega-close")
    if close_btn.count() > 0:
        close_btn.first.click()
        page.wait_for_timeout(100)
    return urls


def discover_first_product_url(page: Page, base_url: str) -> str:
    goto_ready(page, f"{base_url}/danh-muc/tat-ca")
    href = page.eval_on_selector(
        'a[href^="/san-pham/"]',
        "el => el.getAttribute('href')",
    )
    assert href, "Could not discover any /san-pham/<slug> link on /danh-muc/tat-ca"
    return href


def discover_collection_url(page: Page, base_url: str) -> str:
    goto_ready(page, f"{base_url}/bo-suu-tap")
    href = page.eval_on_selector(
        '.v2-bst-card a[href], .v2-bst-link[href]',
        "el => el.getAttribute('href')",
    )
    assert href, "Could not discover any collection link on /bo-suu-tap"
    return href


def discover_article_url(page: Page, base_url: str) -> str:
    goto_ready(page, f"{base_url}/thu-vien")
    href = page.eval_on_selector(
        'a[href^="/thu-vien/"]',
        "el => el.getAttribute('href')",
    )
    assert href, "Could not discover any /thu-vien/<slug> link on /thu-vien"
    return href


def discover_news_url(page: Page, base_url: str) -> str:
    goto_ready(page, f"{base_url}/tin-tuc")
    href = page.eval_on_selector(
        'a[href^="/tin-tuc/"]',
        "el => el.getAttribute('href')",
    )
    assert href, "Could not discover any /tin-tuc/<slug> link on /tin-tuc"
    return href


def parse_aspect_ratio(spec: str) -> float:
    parts = [p.strip() for p in spec.split("/")]
    return float(parts[0]) / float(parts[1])


def extract_parity_snapshot(page: Page, mode: str = "home") -> Dict[str, Any]:
    if mode == "chrome":
        return page.evaluate(
            """() => {
                const v2 = document.querySelector('.v2') || document.body;
                const v2Style = getComputedStyle(v2);
                const bodyStyle = getComputedStyle(document.body);
                const wrap = document.querySelector('.v2-wrap');
                const headerTop = document.querySelector('.v2-header-top');
                const headerBar = document.querySelector('.v2-header-bar');
                const footerForm = document.querySelector('.v2-footer-form');
                const footerMain = document.querySelector('.v2-footer-main');
                const fabTrigger = document.querySelector('.ny-contact-trigger');
                const topBtn = document.querySelector('.v2-pd-top');
                const rect = (el) => el ? el.getBoundingClientRect() : null;
                return {
                    viewport: { width: window.innerWidth, height: window.innerHeight },
                    scrollWidth: document.documentElement.scrollWidth,
                    tokens: {
                        black: v2Style.getPropertyValue('--v2-black').trim(),
                        ink: v2Style.getPropertyValue('--v2-ink').trim(),
                        slate: v2Style.getPropertyValue('--v2-slate').trim(),
                        light: v2Style.getPropertyValue('--v2-light').trim(),
                        megaLight: v2Style.getPropertyValue('--v2-mega-light').trim(),
                        text: v2Style.getPropertyValue('--v2-text').trim(),
                        textSoft: v2Style.getPropertyValue('--v2-text-soft').trim(),
                        muted: v2Style.getPropertyValue('--v2-muted').trim(),
                        gold: v2Style.getPropertyValue('--v2-gold').trim(),
                        goldInk: v2Style.getPropertyValue('--v2-gold-ink').trim(),
                        ease: v2Style.getPropertyValue('--v2-ease').trim(),
                    },
                    fontFamily: bodyStyle.fontFamily,
                    wrapWidth: wrap ? rect(wrap).width : null,
                    headerTopHeight: headerTop ? rect(headerTop).height : null,
                    headerTopDisplay: headerTop ? getComputedStyle(headerTop).display : null,
                    headerBarHeight: headerBar ? rect(headerBar).height : null,
                    footerFormBg: footerForm ? getComputedStyle(footerForm).backgroundColor : null,
                    footerMainBg: footerMain ? getComputedStyle(footerMain).backgroundColor : null,
                    fabTriggerSize: fabTrigger ? { w: rect(fabTrigger).width, h: rect(fabTrigger).height } : null,
                    backToTopSize: topBtn ? {
                        w: topBtn.offsetWidth || parseFloat(getComputedStyle(topBtn).width) || 0,
                        h: topBtn.offsetHeight || parseFloat(getComputedStyle(topBtn).height) || 0,
                    } : null,
                };
            }"""
        )
    if mode == "home":
        return page.evaluate(
            """() => {
                const main = document.querySelector('main') || document.body;
                const sections = Array.from(main.querySelectorAll(':scope > section'));
                return {
                    viewport: { width: window.innerWidth, height: window.innerHeight },
                    scrollWidth: document.documentElement.scrollWidth,
                    sectionCount: sections.length,
                    sections: sections.map((sec, idx) => {
                        const r = sec.getBoundingClientRect();
                        const st = getComputedStyle(sec);
                        return {
                            index: idx + 1,
                            id: sec.id || null,
                            className: sec.className,
                            bg: st.backgroundColor,
                            height: Math.round(r.height),
                            width: Math.round(r.width),
                            paddingTop: parseFloat(st.paddingTop),
                            paddingBottom: parseFloat(st.paddingBottom),
                        };
                    }),
                };
            }"""
        )
    return page.evaluate(
        """() => ({
            viewport: { width: window.innerWidth, height: window.innerHeight },
            scrollWidth: document.documentElement.scrollWidth,
            title: document.title,
        })"""
    )


def probe_live_reference(
    browser: Browser,
    ref_url: str,
    viewport: str = "1440x900",
    mode: str = "home",
) -> Dict[str, Any]:
    """Probes live https://www.nhuydecor.vn/ safely with domcontentloaded (never networkidle)."""
    vp = parse_viewport(viewport)
    ctx = browser.new_context(viewport=vp, locale="vi-VN")
    page = ctx.new_page()
    page.set_default_timeout(15000)
    try:
        ctx.add_init_script("try { sessionStorage.setItem('ny_splash_done', '1'); } catch (e) {}")
        page.goto(ref_url, wait_until="domcontentloaded", timeout=20000)
        page.wait_for_timeout(1200)
        snap = extract_parity_snapshot(page, mode=mode)
        return {"ok": True, "url": ref_url, "snapshot": snap}
    except Exception as exc:
        return {"ok": False, "url": ref_url, "error": str(exc)}
    finally:
        ctx.close()
