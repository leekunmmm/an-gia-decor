import sys

sys.dont_write_bytecode = True

import re
from urllib.parse import urljoin

from playwright.sync_api import Browser, TimeoutError as PlaywrightTimeoutError

from helpers import (
    RunConfig,
    assert_all_images_loaded,
    assert_channel_links_complete,
    assert_no_horizontal_overflow,
    discover_category_urls,
    goto_ready,
    open_auth_modal,
    open_page,
    scroll_and_reveal,
    test_case,
    wait_for_splash_clear,
)


def _norm_color(val: str) -> str:
    return re.sub(r"\s+", " ", (val or "").strip().lower())


def _is_hex_or_rgb(val: str, expected_rgb: str, expected_hexes: tuple) -> bool:
    v = _norm_color(val)
    return v == _norm_color(expected_rgb) or v in tuple(h.lower() for h in expected_hexes)


# ==============================================================================
# Feature #1: CSS Design System & Tokens (F01 — 5 tests)
# ==============================================================================


@test_case("T1-F01-01", 1, ["F01"], "1440x900", "Inspect .v2 computed CSS custom properties")
def t1_f01_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        tokens = page.evaluate(
            """() => {
                const el = document.querySelector('.v2') || document.documentElement;
                const st = getComputedStyle(el);
                const probe = (prop, cssProp) => {
                    const d = document.createElement('div');
                    d.style.setProperty(cssProp, `var(${prop})`);
                    el.appendChild(d);
                    const val = getComputedStyle(d).getPropertyValue(cssProp);
                    d.remove();
                    return val;
                };
                return {
                    black: probe('--v2-black', 'color'),
                    ink: probe('--v2-ink', 'color'),
                    slate: probe('--v2-slate', 'color'),
                    gold: probe('--v2-gold', 'color'),
                    goldInk: probe('--v2-gold-ink', 'color'),
                    text: probe('--v2-text', 'color'),
                    textSoft: probe('--v2-text-soft', 'color'),
                    muted: probe('--v2-muted', 'color'),
                    ease: st.getPropertyValue('--v2-ease').trim(),
                };
            }"""
        )
        assert tokens["black"] == "rgb(0, 0, 0)", f"--v2-black mismatch: {tokens['black']}"
        assert tokens["ink"] == "rgb(20, 22, 25)", f"--v2-ink mismatch: {tokens['ink']}"
        assert tokens["slate"] == "rgb(41, 45, 52)", f"--v2-slate mismatch: {tokens['slate']}"
        assert tokens["gold"] == "rgb(226, 173, 33)", f"--v2-gold mismatch: {tokens['gold']}"
        assert tokens["goldInk"] == "rgb(138, 101, 16)", f"--v2-gold-ink mismatch: {tokens['goldInk']}"
        assert tokens["text"] == "rgb(255, 255, 255)", f"--v2-text mismatch: {tokens['text']}"
        assert tokens["textSoft"] == "rgb(204, 204, 204)", f"--v2-text-soft mismatch: {tokens['textSoft']}"
        assert tokens["muted"] == "rgb(156, 156, 156)", f"--v2-muted mismatch: {tokens['muted']}"
        assert re.search(r"0?\.22,\s*1,\s*0?\.36,\s*1", tokens["ease"]), f"--v2-ease mismatch: {tokens['ease']}"
        guard.assert_clean("T1-F01-01")
    finally:
        ctx.close()


@test_case("T1-F01-02", 1, ["F01"], "1440x900", "Verify Montserrat webfont loaded and active")
def t1_f01_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        font_info = page.evaluate(
            """async () => {
                await document.fonts.ready;
                const loaded = [];
                for (const f of document.fonts) {
                    if (f.status === 'loaded') {
                        loaded.push({ family: f.family, weight: String(f.weight) });
                    }
                }
                const bodyFamily = getComputedStyle(document.body).fontFamily;
                const v2El = document.querySelector('.v2');
                const v2Family = v2El ? getComputedStyle(v2El).fontFamily : bodyFamily;
                return { loaded, bodyFamily, v2Family };
            }"""
        )
        assert "montserrat" in font_info["bodyFamily"].lower(), f"body fontFamily: {font_info['bodyFamily']}"
        assert "montserrat" in font_info["v2Family"].lower(), f".v2 fontFamily: {font_info['v2Family']}"
        mont_weights = {
            f["weight"]
            for f in font_info["loaded"]
            if "montserrat" in f["family"].lower()
        }
        assert len(mont_weights) >= 1, f"Expected loaded Montserrat font faces, got {font_info['loaded'][:5]}"
        guard.assert_clean("T1-F01-02")
    finally:
        ctx.close()


@test_case("T1-F01-03", 1, ["F01"], "1440x900", "Verify .v2-wrap width 1320px and .v2-section padding 128px")
def t1_f01_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        metrics = page.evaluate(
            """() => {
                const wrap = document.querySelector('.v2-wrap');
                const sec = document.querySelector('.v2-about.v2-section') || document.querySelector('.v2-section');
                return {
                    wrapW: wrap ? wrap.getBoundingClientRect().width : null,
                    padTop: sec ? parseFloat(getComputedStyle(sec).paddingTop) : null,
                    padBottom: sec ? parseFloat(getComputedStyle(sec).paddingBottom) : null,
                };
            }"""
        )
        assert metrics["wrapW"] is not None and abs(metrics["wrapW"] - 1320) <= 4, f".v2-wrap width: {metrics['wrapW']}"
        assert metrics["padTop"] is not None and abs(metrics["padTop"] - 128) <= 4, f"section padTop: {metrics['padTop']}"
        assert metrics["padBottom"] is not None and abs(metrics["padBottom"] - 128) <= 4, f"section padBottom: {metrics['padBottom']}"
        guard.assert_clean("T1-F01-03")
    finally:
        ctx.close()


@test_case("T1-F01-04", 1, ["F01"], "1440x900", "Verify typography token scales (.v2-hero-title, .v2-title, .v2-eyebrow)")
def t1_f01_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        typo = page.evaluate(
            """() => {
                const pick = (sel) => {
                    const el = document.querySelector(sel);
                    if (!el) return null;
                    const st = getComputedStyle(el);
                    return {
                        fontSize: parseFloat(st.fontSize),
                        fontWeight: parseInt(st.fontWeight, 10),
                        textTransform: st.textTransform,
                        letterSpacing: st.letterSpacing,
                        color: st.color,
                    };
                };
                return {
                    heroTitle: pick('.v2-hero-title'),
                    title: pick('.v2-title'),
                    eyebrow: pick('.v2-eyebrow'),
                };
            }"""
        )
        ht = typo["heroTitle"]
        assert ht is not None, "Missing .v2-hero-title"
        assert abs(ht["fontSize"] - 76) <= 3, f".v2-hero-title size={ht['fontSize']}"
        assert ht["fontWeight"] >= 600, f".v2-hero-title weight={ht['fontWeight']}"
        assert ht["textTransform"] == "uppercase", f".v2-hero-title transform={ht['textTransform']}"

        t = typo["title"]
        assert t is not None, "Missing .v2-title"
        assert abs(t["fontSize"] - 56) <= 4, f".v2-title size={t['fontSize']}"
        assert t["fontWeight"] <= 400, f".v2-title weight={t['fontWeight']}"
        assert t["textTransform"] == "uppercase"

        eb = typo["eyebrow"]
        assert eb is not None, "Missing .v2-eyebrow"
        assert abs(eb["fontSize"] - 12) <= 1.5, f".v2-eyebrow size={eb['fontSize']}"
        assert eb["fontWeight"] >= 700, f".v2-eyebrow weight={eb['fontWeight']}"
        assert eb["color"] == "rgb(226, 173, 33)", f".v2-eyebrow color={eb['color']}"
        guard.assert_clean("T1-F01-04")
    finally:
        ctx.close()


@test_case("T1-F01-05", 1, ["F01"], "1440x900", "Verify interactive primitives (.v2-pill, .v2-more, .v2-round)")
def t1_f01_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.evaluate("window.scrollTo(0, 480)")
        page.wait_for_timeout(300)
        prims = page.evaluate(
            """() => {
                const pill = document.querySelector('.v2-pill');
                const more = document.querySelector('.v2-more');
                const moreIcon = document.querySelector('.v2-more-icon');
                const roundBtn = document.querySelector('.v2-round');
                return {
                    pill: pill ? {
                        radius: parseFloat(getComputedStyle(pill).borderRadius),
                        h: pill.getBoundingClientRect().height
                    } : null,
                    more: more ? {
                        hasIcon: Boolean(moreIcon),
                        iconW: moreIcon ? moreIcon.getBoundingClientRect().width : 0,
                        iconH: moreIcon ? moreIcon.getBoundingClientRect().height : 0,
                    } : null,
                    round: roundBtn ? {
                        w: roundBtn.getBoundingClientRect().width,
                        h: roundBtn.getBoundingClientRect().height,
                        radius: getComputedStyle(roundBtn).borderRadius,
                    } : null,
                };
            }"""
        )
        assert prims["pill"] is not None, "Missing .v2-pill"
        assert prims["pill"]["radius"] >= 90, f".v2-pill radius={prims['pill']['radius']}"
        assert prims["pill"]["h"] >= 44, f".v2-pill height={prims['pill']['h']}"

        assert prims["more"] is not None and prims["more"]["hasIcon"], "Missing .v2-more / .v2-more-icon"
        assert prims["more"]["iconW"] >= 32 and prims["more"]["iconH"] >= 32

        assert prims["round"] is not None, "Missing .v2-round"
        assert prims["round"]["w"] >= 46 and prims["round"]["h"] >= 46
        guard.assert_clean("T1-F01-05")
    finally:
        ctx.close()


# ==============================================================================
# Feature #2: .v2-reveal Scroll Observer (F02 — 5 tests)
# ==============================================================================


@test_case("T1-F02-01", 1, ["F02"], "1440x900", "Above-the-fold Hero reveal/split becomes visible on load")
def t1_f02_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.wait_for_timeout(350)
        hero_vis = page.evaluate(
            """() => {
                const hero = document.querySelector('.v2-hero, .v2-hero-cover');
                if (!hero) return null;
                const targets = Array.from(hero.querySelectorAll('.v2-split, .v2-reveal, [data-reveal], h1, .v2-hero-title'));
                return targets.map(el => ({
                    cls: el.className,
                    opacity: parseFloat(getComputedStyle(el).opacity),
                    shown: el.classList.contains('is-shown') || el.classList.contains('is-revealed')
                }));
            }"""
        )
        assert hero_vis is not None and len(hero_vis) > 0
        assert all(item["opacity"] >= 0.99 for item in hero_vis), f"Hero reveal stuck invisible: {hero_vis}"
        guard.assert_clean("T1-F02-01")
    finally:
        ctx.close()


@test_case("T1-F02-02", 1, ["F02"], "1440x900", "Scroll down middle sections: .v2-reveal/[data-reveal] gain .is-shown and opacity=1")
def t1_f02_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        scroll_and_reveal(page, step_px=550, pause_ms=110)
        page.wait_for_timeout(350)
        stats = page.evaluate(
            """() => {
                const els = Array.from(document.querySelectorAll('.v2-reveal, [data-reveal]'));
                const stuck = [];
                let shownCount = 0;
                for (const el of els) {
                    const st = getComputedStyle(el);
                    if (st.display === 'none') continue;
                    const op = parseFloat(st.opacity);
                    if (el.classList.contains('is-shown') || el.classList.contains('is-revealed')) {
                        shownCount += 1;
                    }
                    if (op < 0.9) {
                        stuck.push({ tag: el.tagName, cls: el.className, opacity: op });
                    }
                }
                return { total: els.length, shownCount, stuck };
            }"""
        )
        assert stats["total"] > 0, "Expected .v2-reveal or [data-reveal] elements on /"
        assert stats["shownCount"] > 0, "Expected .is-shown / .is-revealed classes applied after scrolling"
        assert not stats["stuck"], f"Elements stuck at low opacity after full scroll: {stats['stuck'][:5]}"
        guard.assert_clean("T1-F02-02")
    finally:
        ctx.close()


@test_case("T1-F02-03", 1, ["F02"], "1440x900", "DreamSpaces & RoomApplications .v2-hotspots gain .is-shown on intersection")
def t1_f02_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        for sel in ["#rooms", ".v2-space"]:
            loc = page.locator(sel).first
            loc.scroll_into_view_if_needed()
            page.wait_for_timeout(300)
        hs = page.evaluate(
            """() => Array.from(document.querySelectorAll('.v2-hotspots')).map(el => ({
                cls: el.className,
                opacity: parseFloat(getComputedStyle(el).opacity),
                shown: el.classList.contains('is-shown') || el.classList.contains('is-revealed')
            }))"""
        )
        assert len(hs) >= 1, "Expected .v2-hotspots containers on /"
        assert all(item["opacity"] >= 0.9 for item in hs), f"Hotspot containers did not reveal: {hs}"
        guard.assert_clean("T1-F02-03")
    finally:
        ctx.close()


@test_case("T1-F02-04", 1, ["F02"], "1440x900", "Client-side navigation to /bo-suu-tap re-attaches reveal observer")
def t1_f02_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator('header a[href="/bo-suu-tap"]').first.click()
        page.wait_for_url("**/bo-suu-tap", timeout=10000)
        page.wait_for_timeout(250)
        scroll_and_reveal(page, step_px=500, pause_ms=110)
        page.wait_for_timeout(400)
        cards = page.evaluate(
            """() => Array.from(document.querySelectorAll('.v2-bst-card')).map(el => ({
                shown: el.classList.contains('is-shown'),
                opacity: parseFloat(getComputedStyle(el).opacity)
            }))"""
        )
        assert len(cards) >= 2, "Expected .v2-bst-card elements on /bo-suu-tap"
        assert all(c["shown"] and c["opacity"] >= 0.9 for c in cards), f"Unrevealed collection cards after client nav: {cards}"
        guard.assert_clean("T1-F02-04")
    finally:
        ctx.close()


@test_case("T1-F02-05", 1, ["F02"], "1440x900", "Emulate prefers-reduced-motion: reduce reveals all elements immediately")
def t1_f02_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900", reduced_motion=True)
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.wait_for_timeout(250)
        stuck = page.evaluate(
            """() => Array.from(document.querySelectorAll('.v2-reveal, [data-reveal], .v2-split, .v2-hotspots'))
                .filter(el => getComputedStyle(el).display !== 'none' && parseFloat(getComputedStyle(el).opacity) < 0.9)
                .map(el => ({ cls: el.className, opacity: getComputedStyle(el).opacity }))"""
        )
        assert not stuck, f"Elements stuck invisible under prefers-reduced-motion: reduce: {stuck[:5]}"
        guard.assert_clean("T1-F02-05")
    finally:
        ctx.close()


# ==============================================================================
# Feature #3: PreloaderSplash (F03 — 5 tests)
# ==============================================================================


@test_case("T1-F03-01", 1, ["F03"], "1440x900", "Fresh load / renders .ny-splash #18171c with AG SVG monogram")
def t1_f03_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900", skip_splash=False)
    try:
        page.goto(f"{cfg.base_url}/", wait_until="domcontentloaded", timeout=20000)
        splash = page.locator(".ny-splash")
        splash.wait_for(state="visible", timeout=3000)
        info = page.evaluate(
            """() => {
                const el = document.querySelector('.ny-splash');
                if (!el) return null;
                const st = getComputedStyle(el);
                const svg = el.querySelector('svg');
                return {
                    bg: st.backgroundColor,
                    role: el.getAttribute('role'),
                    text: (el.innerText || '').trim(),
                    hasSvg: Boolean(svg),
                    shapes: svg ? svg.querySelectorAll('path, rect, circle').length : 0,
                };
            }"""
        )
        assert info is not None, "Missing .ny-splash"
        assert info["bg"] == "rgb(24, 23, 28)", f"Splash bg={info['bg']}"
        assert info["role"] == "status", f"Splash role={info['role']}"
        assert info["hasSvg"] and info["shapes"] >= 2, f"Missing SVG monogram in splash: {info}"
        assert cfg.brand["name"].lower() in info["text"].lower(), f"Splash text missing brand name: {info['text']}"
        wait_for_splash_clear(page, timeout_ms=4500)
        guard.assert_clean("T1-F03-01")
    finally:
        ctx.close()


@test_case("T1-F03-02", 1, ["F03"], "1440x900", "Splash auto-dismisses cleanly and sets ag_splash_done=1")
def t1_f03_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900", skip_splash=False)
    try:
        page.goto(f"{cfg.base_url}/", wait_until="domcontentloaded", timeout=20000)
        page.locator(".ny-splash").wait_for(state="visible", timeout=3000)
        wait_for_splash_clear(page, timeout_ms=4000)
        flag = page.evaluate("() => window.sessionStorage.getItem('ag_splash_done')")
        assert flag == "1", f"Expected sessionStorage ag_splash_done === '1', got {flag!r}"
        guard.assert_clean("T1-F03-02")
    finally:
        ctx.close()


@test_case("T1-F03-03", 1, ["F03"], "1440x900", "Clicking .ny-splash dismisses early and sets ag_splash_done=1")
def t1_f03_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900", skip_splash=False)
    try:
        page.goto(f"{cfg.base_url}/", wait_until="domcontentloaded", timeout=20000)
        splash = page.locator(".ny-splash")
        splash.wait_for(state="visible", timeout=3000)
        splash.click()
        wait_for_splash_clear(page, timeout_ms=1000)
        flag = page.evaluate("() => window.sessionStorage.getItem('ag_splash_done')")
        assert flag == "1", f"Expected ag_splash_done === '1' on click skip, got {flag!r}"
        guard.assert_clean("T1-F03-03")
    finally:
        ctx.close()


@test_case("T1-F03-04", 1, ["F03"], "1440x900", "Inner route /du-an fresh load uses spinner mode or resolves cleanly")
def t1_f03_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900", skip_splash=False)
    try:
        page.goto(f"{cfg.base_url}/du-an", wait_until="domcontentloaded", timeout=20000)
        page.wait_for_timeout(150)
        inner_mode = page.evaluate(
            """() => {
                const el = document.querySelector('.ny-splash');
                if (!el) return { present: false };
                return {
                    present: true,
                    mode: el.getAttribute('data-splash-mode') || '',
                    hasSpinner: Boolean(el.querySelector('.ny-splash-spinner')),
                };
            }"""
        )
        if inner_mode["present"]:
            assert inner_mode["mode"] == "spin" or inner_mode["hasSpinner"], (
                f"Inner route splash should use spinner mode (data-splash-mode='spin' or .ny-splash-spinner): {inner_mode}"
            )
        wait_for_splash_clear(page, timeout_ms=4500)
        assert page.locator("h1").count() > 0
        guard.assert_clean("T1-F03-04")
    finally:
        ctx.close()


@test_case("T1-F03-05", 1, ["F03"], "1440x900", "Reloading / in same BrowserContext respects ag_splash_done=1")
def t1_f03_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900", skip_splash=False)
    try:
        page.goto(f"{cfg.base_url}/", wait_until="domcontentloaded", timeout=20000)
        wait_for_splash_clear(page, timeout_ms=4500)
        page.reload(wait_until="domcontentloaded")
        page.wait_for_timeout(200)
        blocking = page.evaluate(
            """() => {
                const el = document.querySelector('.ny-splash');
                if (!el) return false;
                const st = getComputedStyle(el);
                return st.display !== 'none' && st.visibility !== 'hidden' && parseFloat(st.opacity) > 0;
            }"""
        )
        assert not blocking, "Splash overlay must not block viewport after ag_splash_done === '1'"
        guard.assert_clean("T1-F03-05")
    finally:
        ctx.close()


# ==============================================================================
# Feature #4: SiteHeader (2-tier + glass + mobile) (F04 — 6 tests)
# ==============================================================================


@test_case("T1-F04-01", 1, ["F04"], "1440x900", "Verify 2-tier desktop header dimensions, utility links, and 8 nav items")
def t1_f04_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        hdr = page.evaluate(
            """() => {
                const top = document.querySelector('.v2-header-top');
                const bar = document.querySelector('.v2-header-bar');
                const navItems = Array.from(document.querySelectorAll('.v2-nav .v2-nav-link'))
                    .map(el => el.innerText.trim());
                const tel = top ? top.querySelector('a[href^="tel:"]')?.getAttribute('href') : null;
                const mail = top ? top.querySelector('a[href^="mailto:"]')?.getAttribute('href') : null;
                return {
                    topH: top ? top.getBoundingClientRect().height : 0,
                    barH: bar ? bar.getBoundingClientRect().height : 0,
                    navItems,
                    tel,
                    mail,
                };
            }"""
        )
        assert abs(hdr["topH"] - 40) <= 2, f".v2-header-top height={hdr['topH']}"
        assert abs(hdr["barH"] - 76) <= 2, f".v2-header-bar height={hdr['barH']}"
        assert hdr["tel"] == f"tel:{cfg.brand['hotlineRaw']}", f"Header tel={hdr['tel']}"
        assert hdr["mail"] == f"mailto:{cfg.brand['email']}", f"Header mail={hdr['mail']}"
        expected_nav = ["Sản phẩm", "Phòng", "Bộ sưu tập", "Dự án", "Tin tức", "Thư viện", "Showroom", "Liên hệ"]
        actual_lower = [x.lower() for x in hdr["navItems"]]
        for label in expected_nav:
            assert any(label.lower() in x for x in actual_lower), f"Missing nav item {label!r} in {hdr['navItems']}"
        guard.assert_clean("T1-F04-01")
    finally:
        ctx.close()


@test_case("T1-F04-02", 1, ["F04"], "1440x900", "Scroll down 600px: header adds .is-scrolled & .is-hidden, bar shrinks to 60px glass")
def t1_f04_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.evaluate("window.scrollTo(0, 600)")
        page.wait_for_timeout(450)
        st = page.evaluate(
            """() => {
                const h = document.querySelector('.v2-header');
                const bar = document.querySelector('.v2-header-bar');
                const hStyle = getComputedStyle(h);
                const bStyle = getComputedStyle(bar);
                return {
                    isScrolled: h.classList.contains('is-scrolled'),
                    isHidden: h.classList.contains('is-hidden'),
                    transform: hStyle.transform,
                    barH: bar.getBoundingClientRect().height,
                    backdrop: bStyle.backdropFilter || bStyle.webkitBackdropFilter || '',
                };
            }"""
        )
        assert st["isScrolled"], "Expected .v2-header.is-scrolled after scrolling 600px"
        assert st["isHidden"], "Expected .v2-header.is-hidden when scrolling down"
        m = re.match(r"matrix\([^,]+,[^,]+,[^,]+,[^,]+,[^,]+,\s*([^)]+)\)", st["transform"])
        ty = float(m.group(1)) if m else 0.0
        assert abs(ty - (-40)) <= 1.5, f"Expected translateY(-40px) matrix, got {st['transform']}"
        assert abs(st["barH"] - 60) <= 2, f"Scrolled .v2-header-bar height={st['barH']}"
        assert "blur" in st["backdrop"].lower(), f"Expected glass backdrop-filter blur, got {st['backdrop']!r}"
        guard.assert_clean("T1-F04-02")
    finally:
        ctx.close()


@test_case("T1-F04-03", 1, ["F04"], "1440x900", "Scroll up 250px: .is-hidden removed while .is-scrolled glass remains")
def t1_f04_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.evaluate("window.scrollTo(0, 650)")
        page.wait_for_timeout(250)
        page.evaluate("window.scrollTo(0, 400)")
        page.wait_for_timeout(480)
        st = page.evaluate(
            """() => {
                const h = document.querySelector('.v2-header');
                return {
                    isScrolled: h.classList.contains('is-scrolled'),
                    isHidden: h.classList.contains('is-hidden'),
                    top: h.getBoundingClientRect().top,
                };
            }"""
        )
        assert st["isScrolled"], "Expected .is-scrolled preserved at scrollY=400"
        assert not st["isHidden"], "Expected .is-hidden removed on upward scroll"
        assert abs(st["top"]) <= 2, f"Expected header top=0 when unhidden, got {st['top']}"
        guard.assert_clean("T1-F04-03")
    finally:
        ctx.close()


@test_case("T1-F04-04", 1, ["F04"], "1440x900", "Hover .v2-roll nav link: duplicate span structure & single-line geometry")
def t1_f04_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        roll_links = page.locator("header .v2-nav-link .v2-roll, header .v2-nav-link.v2-roll")
        assert roll_links.count() > 0, "Expected .v2-roll text roll primitives in header navigation"
        first = roll_links.first
        first.hover()
        page.wait_for_timeout(150)
        info = first.evaluate(
            """el => {
                const spans = el.querySelectorAll('span');
                const r = el.getBoundingClientRect();
                return { spanCount: spans.length, height: r.height, width: r.width };
            }"""
        )
        assert info["spanCount"] >= 2, f"Expected duplicate span layers inside .v2-roll, got {info['spanCount']}"
        assert info["height"] <= 34, f".v2-roll link wrapped onto multiple lines (height={info['height']})"
        guard.assert_clean("T1-F04-04")
    finally:
        ctx.close()


@test_case("T1-F04-05", 1, ["F04"], "390x844", "Mobile header hides top bar, sets 64px bar, and shows burger button")
def t1_f04_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        m = page.evaluate(
            """() => {
                const top = document.querySelector('.v2-header-top');
                const bar = document.querySelector('.v2-header-bar');
                const burger = document.querySelector('.v2-burger') || document.querySelector('header button[aria-label*="menu" i], header button[aria-label*="Mở"]');
                return {
                    topDisplay: top ? getComputedStyle(top).display : 'none',
                    barH: bar ? bar.getBoundingClientRect().height : 0,
                    burgerVisible: burger ? (getComputedStyle(burger).display !== 'none' && burger.getBoundingClientRect().width > 0) : false,
                };
            }"""
        )
        assert m["topDisplay"] == "none", f"Expected .v2-header-top hidden on mobile, got {m['topDisplay']}"
        assert abs(m["barH"] - 64) <= 2, f"Expected mobile .v2-header-bar height 64px, got {m['barH']}"
        assert m["burgerVisible"], "Expected visible mobile burger button"
        guard.assert_clean("T1-F04-05")
    finally:
        ctx.close()


@test_case("T1-F04-06", 1, ["F04"], "390x844", "Tap mobile burger opens .v2-mobile-menu with accordion and tel: CTA")
def t1_f04_06(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        burger = page.locator(".v2-burger, header button[aria-label*='menu' i]").first
        burger.click()
        drawer = page.locator(".v2-mobile-menu")
        drawer.wait_for(state="visible", timeout=4000)
        bg = drawer.evaluate("el => getComputedStyle(el).backgroundColor")
        assert bg == "rgb(22, 23, 27)", f".v2-mobile-menu bg={bg}"
        tel_href = drawer.locator('a[href^="tel:"]').first.get_attribute("href")
        assert tel_href == f"tel:{cfg.brand['hotlineRaw']}", f"Mobile drawer tel={tel_href}"
        # Expand Sản phẩm accordion if present
        prod_btn = drawer.locator("button", has_text="Sản phẩm")
        assert prod_btn.count() > 0, "Expected 'Sản phẩm' expandable control in mobile drawer"
        prod_btn.first.click()
        page.wait_for_timeout(150)
        assert drawer.locator('a[href^="/danh-muc/"]').count() > 0, "Expected category links after expanding Sản phẩm"
        # Close drawer
        burger.click()
        page.wait_for_timeout(200)
        assert drawer.count() == 0 or not drawer.is_visible(), "Expected mobile drawer to dismiss on close"
        guard.assert_clean("T1-F04-06")
    finally:
        ctx.close()


# ==============================================================================
# Feature #5: MegaMenu (~39 Vietnamese categories) (F05 — 5 tests)
# ==============================================================================


@test_case("T1-F05-01", 1, ["F05"], "1440x900", "Click Sản phẩm opens fullscreen 3-column .v2-mega with aria-expanded=true")
def t1_f05_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        btn = page.locator("header button", has_text="Sản phẩm").first
        btn.click()
        mega = page.locator(".v2-mega")
        mega.wait_for(state="visible", timeout=4000)
        assert btn.get_attribute("aria-expanded") == "true"
        layout = mega.evaluate(
            """el => {
                const body = el.querySelector('.v2-mega-body');
                const cols = body ? getComputedStyle(body).gridTemplateColumns.split(' ').length : 0;
                return {
                    bg: getComputedStyle(el).backgroundColor,
                    cols,
                    hasClose: Boolean(el.querySelector('.v2-mega-close')),
                    hasHeading: Boolean(el.querySelector('.v2-mega-heading')),
                };
            }"""
        )
        assert layout["bg"] == "rgb(20, 21, 25)", f".v2-mega bg={layout['bg']}"
        assert layout["cols"] == 3, f"Expected 3 columns in .v2-mega-body, got {layout['cols']}"
        assert layout["hasClose"] and layout["hasHeading"]
        guard.assert_clean("T1-F05-01")
    finally:
        ctx.close()


@test_case("T1-F05-02", 1, ["F05"], "1440x900", "MegaMenu provides >= 35 (~39) Vietnamese categories with zero nhuydecor text")
def t1_f05_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        urls = discover_category_urls(page, cfg.base_url)
        page.locator("header button:visible", has_text="Sản phẩm").first.click()
        page.locator(".v2-mega").wait_for(state="visible", timeout=4000)
        room_count = page.locator(".v2-mega-rooms li").count()
        total_cats = max(len(urls), room_count)
        assert total_cats >= 35, (
            f"Expected expanded An Gia Decor MegaMenu >= 35 categories (~39 target), got {total_cats} "
            f"(uniqueUrls={len(urls)}, rooms={room_count})"
        )
        mega_text = page.locator(".v2-mega").inner_text().lower()
        assert "nhuydecor" not in mega_text and "nhu y" not in mega_text
        guard.assert_clean("T1-F05-02")
    finally:
        ctx.close()


@test_case("T1-F05-03", 1, ["F05"], "1440x900", "Hovering/clicking room buttons updates .is-active, col-2 items, and preview img")
def t1_f05_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator("header button:visible", has_text="Sản phẩm").first.click()
        page.wait_for_selector(".v2-mega", timeout=4000)
        rooms = page.locator(".v2-mega-rooms li button")
        assert rooms.count() >= 3
        initial_title = page.locator(".v2-mega-picture h3").first.inner_text()
        rooms.nth(2).hover()
        rooms.nth(2).click()
        page.wait_for_timeout(150)
        state = page.evaluate(
            """() => {
                const activeLi = document.querySelector('.v2-mega-rooms li.is-active');
                const activeBtn = activeLi ? activeLi.querySelector('button') : null;
                const itemsEl = document.querySelector('.v2-mega-items');
                const img = document.querySelector('.v2-mega-picture img');
                const title = document.querySelector('.v2-mega-picture h3');
                return {
                    activeBg: activeBtn ? getComputedStyle(activeBtn).backgroundColor : '',
                    itemsBg: itemsEl ? getComputedStyle(itemsEl).backgroundColor : '',
                    imgLoaded: img ? (img.complete && img.naturalWidth > 0) : false,
                    title: title ? title.innerText : '',
                    linksCount: itemsEl ? itemsEl.querySelectorAll('a').length : 0,
                };
            }"""
        )
        assert "244, 244, 244" in state["activeBg"], f"Active room bg={state['activeBg']}"
        assert "244, 244, 244" in state["itemsBg"], f"Col-2 items bg={state['itemsBg']}"
        assert state["imgLoaded"], "MegaMenu preview image failed to load"
        assert state["linksCount"] >= 2
        assert state["title"] != initial_title or rooms.count() == 1
        guard.assert_clean("T1-F05-03")
    finally:
        ctx.close()


@test_case("T1-F05-04", 1, ["F05"], "1440x900", "Click MegaMenu category link closes overlay and navigates to /danh-muc/<slug>")
def t1_f05_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator("header button", has_text="Sản phẩm").first.click()
        page.wait_for_selector(".v2-mega", timeout=4000)
        first_cat = page.locator('.v2-mega-items a[href^="/danh-muc/"]').first
        href = first_cat.get_attribute("href")
        first_cat.click()
        page.wait_for_url(f"**{href}", timeout=10000)
        page.wait_for_timeout(200)
        assert page.locator(".v2-mega").count() == 0, "MegaMenu should close after navigation"
        assert page.locator("h1").count() > 0
        guard.assert_clean("T1-F05-04")
    finally:
        ctx.close()


@test_case("T1-F05-05", 1, ["F05"], "390x844", "Mobile drawer Sản phẩm drilldown navigates to /danh-muc/<slug>")
def t1_f05_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator(".v2-burger, header button[aria-label*='menu' i]").first.click()
        drawer = page.locator(".v2-mobile-menu")
        drawer.wait_for(state="visible", timeout=4000)
        drawer.locator("button", has_text="Sản phẩm").first.click()
        page.wait_for_timeout(150)
        cat_link = drawer.locator('a[href^="/danh-muc/"]').first
        href = cat_link.get_attribute("href")
        cat_link.click()
        page.wait_for_url(f"**{href}", timeout=10000)
        assert_no_horizontal_overflow(page, "T1-F05-05")
        guard.assert_clean("T1-F05-05")
    finally:
        ctx.close()


# ==============================================================================
# Feature #6: SearchOverlay (F06 — 5 tests)
# ==============================================================================


@test_case("T1-F06-01", 1, ["F06"], "1440x900", "Click Search button opens .v2-search dialog and focuses input")
def t1_f06_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator('.v2-header button[aria-label*="Tìm kiếm" i]:visible').first.click()
        dlg = page.locator(".v2-search")
        dlg.wait_for(state="visible", timeout=4000)
        page.wait_for_timeout(150)
        focused = page.evaluate(
            """() => {
                const inp = document.querySelector('.v2-search input');
                const box = document.querySelector('.v2-search-box');
                return {
                    hasInput: Boolean(inp),
                    isFocused: document.activeElement === inp,
                    boxBg: box ? getComputedStyle(box).backgroundColor : '',
                    boxW: box ? box.getBoundingClientRect().width : 0,
                };
            }"""
        )
        assert focused["hasInput"] and focused["isFocused"], f"Search input not focused: {focused}"
        assert focused["boxBg"] == "rgb(41, 45, 52)", f".v2-search-box bg={focused['boxBg']}"
        assert focused["boxW"] <= 764
        guard.assert_clean("T1-F06-01")
    finally:
        ctx.close()


@test_case("T1-F06-02", 1, ["F06"], "1440x900", "Typing 'sofa' renders matching results with loaded 56x42 thumbnails")
def t1_f06_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator('.v2-header button[aria-label*="Tìm kiếm" i]:visible').first.click()
        inp = page.locator(".v2-search input").first
        inp.fill("sofa")
        page.wait_for_timeout(150)
        links = page.locator('.v2-search a[href^="/san-pham/"]')
        assert links.count() > 0, "Expected matching product results for 'sofa'"
        thumb_ok = links.first.locator("img").evaluate(
            "img => img.complete && img.naturalWidth > 0 && img.getBoundingClientRect().width >= 40"
        )
        assert thumb_ok, "Search result thumbnail not loaded or wrong size"
        guard.assert_clean("T1-F06-02")
    finally:
        ctx.close()


@test_case("T1-F06-03", 1, ["F06"], "1440x900", "Unaccented Vietnamese query 'ban an' matches accented results")
def t1_f06_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator('.v2-header button[aria-label*="Tìm kiếm" i]:visible').first.click()
        page.locator(".v2-search input").first.fill("ban an")
        page.wait_for_timeout(150)
        text = page.locator(".v2-search-box").inner_text().lower()
        assert "bàn ăn" in text or page.locator('.v2-search a[href^="/san-pham/"]').count() > 0, (
            "Unaccented query 'ban an' should match accented 'Bàn ăn' items"
        )
        guard.assert_clean("T1-F06-03")
    finally:
        ctx.close()


@test_case("T1-F06-04", 1, ["F06"], "1440x900", "Click search product result closes overlay and opens /san-pham/<slug>")
def t1_f06_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator('.v2-header button[aria-label*="Tìm kiếm" i]:visible').first.click()
        page.locator(".v2-search input").first.fill("sofa")
        page.wait_for_timeout(150)
        first_res = page.locator('.v2-search a[href^="/san-pham/"]').first
        href = first_res.get_attribute("href")
        first_res.click()
        page.wait_for_url(f"**{href}", timeout=10000)
        assert page.locator(".v2-search").count() == 0
        guard.assert_clean("T1-F06-04")
    finally:
        ctx.close()


@test_case("T1-F06-05", 1, ["F06"], "390x844", "Mobile SearchOverlay fills full screen with border-radius 0 and closes cleanly")
def t1_f06_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator('.v2-header button[aria-label*="Tìm kiếm" i]:visible').first.click()
        page.wait_for_selector(".v2-search-box", timeout=4000)
        box = page.evaluate(
            """() => {
                const el = document.querySelector('.v2-search-box');
                const r = el.getBoundingClientRect();
                return { w: r.width, h: r.height, radius: parseFloat(getComputedStyle(el).borderRadius) };
            }"""
        )
        assert box["w"] >= 370, f"Mobile search box width={box['w']}"
        assert box["h"] >= 780, f"Expected mobile full-height 100dvh search box, got h={box['h']}"
        assert box["radius"] == 0, f"Expected mobile search box border-radius 0, got {box['radius']}"
        page.locator('.v2-search button[aria-label*="Đóng" i]').first.click()
        page.wait_for_timeout(150)
        assert page.locator(".v2-search").count() == 0
        guard.assert_clean("T1-F06-05")
    finally:
        ctx.close()


# ==============================================================================
# Feature #7: AuthModal UI validation (F07 — 5 tests)
# ==============================================================================


@test_case("T1-F07-01", 1, ["F07"], "1440x900", "Account button opens .auth-dialog with 2 tabs and Đăng nhập active")
def t1_f07_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        dlg = open_auth_modal(page, tab="login")
        login_tab = dlg.locator("button", has_text="Đăng nhập").first
        reg_tab = dlg.locator("button", has_text="Đăng ký").first
        assert login_tab.is_visible() and reg_tab.is_visible()
        assert login_tab.get_attribute("aria-selected") == "true", (
            "Expected active Đăng nhập tab to carry aria-selected='true'"
        )
        guard.assert_clean("T1-F07-01")
    finally:
        ctx.close()


@test_case("T1-F07-02", 1, ["F07"], "1440x900", "Switch to Đăng ký tab displays full registration fields")
def t1_f07_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        dlg = open_auth_modal(page, tab="login")
        reg_tab = dlg.locator("button", has_text="Đăng ký").first
        reg_tab.click()
        assert reg_tab.get_attribute("aria-selected") == "true", (
            "Expected Đăng ký tab to set aria-selected='true'"
        )
        txt = dlg.inner_text()
        for label in ["Họ và tên", "Email", "Số điện thoại", "Mật khẩu", "Nhập lại mật khẩu"]:
            assert label in txt, f"Missing registration field label {label!r} in AuthModal"
        guard.assert_clean("T1-F07-02")
    finally:
        ctx.close()


@test_case("T1-F07-03", 1, ["F07"], "1440x900", "Password visibility toggle switches type between password and text")
def t1_f07_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        dlg = open_auth_modal(page, tab="login")
        pwd_input = dlg.locator('input[type="password"]').first
        assert pwd_input.is_visible()
        toggle = dlg.locator('button[aria-label*="mật khẩu" i]').first
        toggle.click()
        assert dlg.locator('input[type="password"]').count() == 0, "Expected password input to reveal as text"
        toggle.click()
        assert dlg.locator('input[type="password"]').count() >= 1, "Expected password input to mask again"
        guard.assert_clean("T1-F07-03")
    finally:
        ctx.close()


@test_case("T1-F07-04", 1, ["F07"], "1440x900", "Valid registration submits and stores ag_demo_user")
def t1_f07_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        dlg = open_auth_modal(page, tab="register")
        # Fill by label or order cleanly
        dlg.locator('form input[type="text"]').first.fill("Nguyễn Văn A")
        dlg.locator('form input[type="email"]').first.fill("khach@angiadecor.vn")
        tel = dlg.locator('form input[type="tel"]')
        if tel.count() > 0:
            tel.first.fill("0908123456")
        pwds = dlg.locator('form input[type="password"]')
        for i in range(pwds.count()):
            pwds.nth(i).fill("Matkhau123")
        dlg.locator('form button[type="submit"]').click()
        page.wait_for_timeout(200)
        stored = page.evaluate("() => window.localStorage.getItem('ag_demo_user')")
        assert stored and "khach@angiadecor.vn" in stored, f"Expected ag_demo_user saved, got {stored!r}"
        guard.assert_clean("T1-F07-04")
    finally:
        ctx.close()


@test_case("T1-F07-05", 1, ["F07"], "1440x900", "Sign out and sign back in updates header account state")
def t1_f07_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        dlg = open_auth_modal(page, tab="login")
        dlg.locator('form input[type="email"]').fill("khach@angiadecor.vn")
        dlg.locator('form input[type="password"]').fill("Matkhau123")
        dlg.locator('form button[type="submit"]').click()
        page.wait_for_timeout(200)
        # Reopen to sign out
        acct_btn = page.locator('.v2-header button[aria-label*="Tài khoản" i]:visible, .v2-header button[aria-label*="Đăng nhập" i]:visible').first
        if dlg.count() == 0 or not dlg.is_visible():
            acct_btn.click()
        page.locator(".v2-account-menu button, .auth-dialog button", has_text="Đăng xuất").first.click()
        page.wait_for_timeout(150)
        assert page.evaluate("() => window.localStorage.getItem('ag_demo_user')") is None
        if dlg.count() == 0 or not dlg.is_visible():
            dlg = open_auth_modal(page, tab="login")
        else:
            page.wait_for_timeout(120)
        dlg.locator('form input[type="email"]').fill("khach@angiadecor.vn")
        dlg.locator('form input[type="password"]').fill("Matkhau123")
        dlg.locator('form button[type="submit"]').click()
        page.wait_for_timeout(200)
        assert page.evaluate("() => window.localStorage.getItem('ag_demo_user')") is not None
        guard.assert_clean("T1-F07-05")
    finally:
        ctx.close()


# ==============================================================================
# Feature #8: FloatingActions & Channel SVGs (F08 — 6 tests)
# ==============================================================================


@test_case("T1-F08-01", 1, ["F08"], "1440x900", "FloatingActions gold 56x56 trigger visible, actions collapsed initially")
def t1_f08_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        info = page.evaluate(
            """() => {
                const launcher = document.querySelector('.ny-contact-launcher');
                const trig = document.querySelector('.ny-contact-trigger');
                const actions = document.querySelector('.ny-contact-actions');
                const trigRect = trig ? trig.getBoundingClientRect() : null;
                return {
                    hasLauncher: Boolean(launcher),
                    isOpen: launcher ? launcher.classList.contains('is-open') : false,
                    trigW: trigRect ? trigRect.width : 0,
                    trigH: trigRect.height,
                    trigBg: trig ? getComputedStyle(trig).backgroundColor : '',
                    actionsVisible: actions ? (getComputedStyle(actions).opacity !== '0' && getComputedStyle(actions).pointerEvents !== 'none') : false,
                };
            }"""
        )
        assert info["hasLauncher"] and not info["isOpen"]
        assert abs(info["trigW"] - 56) <= 2 and abs(info["trigH"] - 56) <= 2, f"Trigger size {info['trigW']}x{info['trigH']}"
        assert not info["actionsVisible"], "Closed FAB actions must be non-interactive / collapsed"
        guard.assert_clean("T1-F08-01")
    finally:
        ctx.close()


@test_case("T1-F08-02", 1, ["F08"], "1440x900", "Click .ny-contact-trigger adds .is-open and reveals 4 46x46 channels")
def t1_f08_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator(".ny-contact-trigger").click()
        page.wait_for_timeout(200)
        state = page.evaluate(
            """() => {
                const launcher = document.querySelector('.ny-contact-launcher');
                const items = Array.from(document.querySelectorAll('.ny-contact-actions a'));
                return {
                    isOpen: launcher.classList.contains('is-open'),
                    count: items.length,
                    circles: items.map(a => {
                        const c = a.querySelector('.ny-contact-icon, .ny-contact-circle');
                        const r = c ? c.getBoundingClientRect() : { width: 0, height: 0 };
                        return { w: Math.round(r.width), h: Math.round(r.height), op: getComputedStyle(a).opacity };
                    }),
                };
            }"""
        )
        assert state["isOpen"], "Expected .ny-contact-launcher.is-open"
        assert state["count"] == 4, f"Expected 4 FAB channel actions, got {state['count']}"
        for c in state["circles"]:
            assert abs(c["w"] - 46) <= 2 and abs(c["h"] - 46) <= 2, f"FAB icon circle size={c}"
        guard.assert_clean("T1-F08-02")
    finally:
        ctx.close()


@test_case("T1-F08-03", 1, ["F08"], "1440x900", "FloatingActions channel <a> links have inline SVGs and security attributes")
def t1_f08_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator(".ny-contact-trigger").click()
        page.wait_for_timeout(200)
        assert_channel_links_complete(page, ".ny-contact-launcher", cfg.brand, require_svg=True)
        guard.assert_clean("T1-F08-03")
    finally:
        ctx.close()


@test_case("T1-F08-04", 1, ["F08"], "1440x900", "Cross-surface channel parity across Header, FloatingActions, and Footer")
def t1_f08_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator(".ny-contact-trigger").click()
        page.wait_for_timeout(150)
        hdr = assert_channel_links_complete(page, ".v2-header-top", cfg.brand, require_svg=True)
        fab = assert_channel_links_complete(page, ".ny-contact-launcher", cfg.brand, require_svg=True)
        ftr = assert_channel_links_complete(page, ".v2-footer-main", cfg.brand, require_svg=True)
        for ch in ("shopee", "zalo", "messenger", "phone"):
            assert hdr[ch]["href"] == fab[ch]["href"] == ftr[ch]["href"]
        guard.assert_clean("T1-F08-04")
    finally:
        ctx.close()


@test_case("T1-F08-05", 1, ["F08"], "1440x900", "Back-to-top .v2-pd-top.v2-round appears on scroll and scrolls to top")
def t1_f08_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.evaluate("window.scrollTo(0, 1000)")
        page.wait_for_timeout(250)
        btn = page.locator(".v2-pd-top")
        assert "is-shown" in (btn.get_attribute("class") or ""), "Expected .v2-pd-top.is-shown after scrolling 1000px"
        box = btn.bounding_box()
        assert box is not None and abs(box["width"] - 50) <= 2 and abs(box["height"] - 50) <= 2
        btn.click()
        page.wait_for_timeout(900)
        y = page.evaluate("() => window.scrollY")
        assert y < 50, f"Expected scrollY < 50 after clicking back-to-top, got {y}"
        guard.assert_clean("T1-F08-05")
    finally:
        ctx.close()


@test_case("T1-F08-06", 1, ["F08"], "390x844", "Mobile FloatingActions trigger is 52x52 and labels visible without overflow")
def t1_f08_06(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        trig = page.locator(".ny-contact-trigger")
        box = trig.bounding_box()
        assert box is not None and abs(box["width"] - 52) <= 2 and abs(box["height"] - 52) <= 2
        trig.click()
        page.wait_for_timeout(200)
        labels = page.locator(".ny-contact-label")
        assert labels.count() == 4
        for i in range(4):
            assert labels.nth(i).is_visible()
        assert_no_horizontal_overflow(page, "T1-F08-06")
        guard.assert_clean("T1-F08-06")
    finally:
        ctx.close()


# ==============================================================================
# Feature #9: SiteFooter 2-col form + map (F09 — 5 tests)
# ==============================================================================


@test_case("T1-F09-01", 1, ["F09"], "1440x900", "Footer form renders #292d34 2-col floating-label underline layout")
def t1_f09_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator("#footer").scroll_into_view_if_needed()
        info = page.evaluate(
            """() => {
                const band = document.querySelector('.v2-footer-form');
                const form = document.querySelector('.v2-contact-form');
                const fields = form ? form.querySelectorAll('.v2-cf-field') : [];
                const cols = form ? getComputedStyle(form).gridTemplateColumns.split(' ').length : 0;
                return {
                    bg: band ? getComputedStyle(band).backgroundColor : '',
                    cols,
                    floatingFieldsCount: fields.length,
                    hasTextarea: Boolean(form && form.querySelector('textarea')),
                    hasSend: Boolean(form && form.querySelector('.v2-cf-send')),
                };
            }"""
        )
        assert info["bg"] == "rgb(41, 45, 52)", f".v2-footer-form bg={info['bg']}"
        assert info["cols"] == 2, f".v2-contact-form cols={info['cols']}"
        assert info["floatingFieldsCount"] >= 4, f"Expected floating-label .v2-cf-field wrappers, got {info['floatingFieldsCount']}"
        assert info["hasTextarea"] and info["hasSend"]
        guard.assert_clean("T1-F09-01")
    finally:
        ctx.close()


@test_case("T1-F09-02", 1, ["F09"], "1440x900", "Footer floating-label shifts up and border highlights gold on focus")
def t1_f09_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator("#footer").scroll_into_view_if_needed()
        field = page.locator(".v2-cf-field").first
        assert field.count() > 0, "Expected .v2-cf-field floating-label wrapper"
        inp = field.locator("input").first
        lbl = field.locator("span").first
        idle_top = lbl.bounding_box()["y"]
        idle_fs = float(lbl.evaluate("el => parseFloat(getComputedStyle(el).fontSize)"))
        inp.focus()
        inp.fill("Trần Minh Tuấn")
        page.wait_for_timeout(380)
        field_handle = field.element_handle()
        if field_handle is not None:
            try:
                page.wait_for_function(
                    "el => getComputedStyle(el).borderBottomColor === 'rgb(226, 173, 33)'",
                    arg=field_handle,
                    timeout=1500,
                )
            except PlaywrightTimeoutError:
                pass
        focused_top = lbl.bounding_box()["y"]
        focused_fs = float(lbl.evaluate("el => parseFloat(getComputedStyle(el).fontSize)"))
        border_col = field.evaluate("el => getComputedStyle(el).borderBottomColor")
        assert focused_top < idle_top - 4 or focused_fs < idle_fs, (
            f"Floating label did not rise/shrink: idle=({idle_top}, {idle_fs}) -> focused=({focused_top}, {focused_fs})"
        )
        assert border_col == "rgb(226, 173, 33)", f"Focused underline border={border_col}"
        guard.assert_clean("T1-F09-02")
    finally:
        ctx.close()


@test_case("T1-F09-03", 1, ["F09"], "1440x900", "Valid footer contact form submission shows UI confirmation")
def t1_f09_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        form = page.locator(".v2-contact-form")
        form.scroll_into_view_if_needed()
        form.locator('input[type="text"]').nth(0).fill("Trần Minh Tuấn")
        form.locator('input[type="email"]').fill("tuan@example.com")
        form.locator('input[type="tel"]').fill("0908111222")
        if form.locator('input[type="text"]').count() > 1:
            form.locator('input[type="text"]').nth(1).fill("An Gia Studio")
        form.locator("textarea").fill("Tư vấn sofa phòng khách 30m2")
        form.locator(".v2-cf-send").click()
        page.wait_for_timeout(250)
        footer_text = page.locator("#footer").inner_text().lower()
        assert "cảm ơn" in footer_text or "đã tiếp nhận" in footer_text or "gửi yêu cầu khác" in footer_text
        guard.assert_clean("T1-F09-03")
    finally:
        ctx.close()


@test_case("T1-F09-04", 1, ["F09"], "1440x900", "Footer main #141619 3-col grid renders brand info, 4 SVG channels, nav, grayscale map")
def t1_f09_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator(".v2-footer-main").scroll_into_view_if_needed()
        info = page.evaluate(
            """() => {
                const main = document.querySelector('.v2-footer-main');
                const grid = document.querySelector('.v2-footer-grid');
                const mapWrap = document.querySelector('.v2-footer-map');
                const iframe = document.querySelector('.v2-footer-map iframe, iframe.v2-footer-map');
                const mapTarget = iframe || mapWrap;
                return {
                    bg: main ? getComputedStyle(main).backgroundColor : '',
                    cols: grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').length : 0,
                    mapFilter: iframe ? getComputedStyle(iframe).filter : (mapWrap ? getComputedStyle(mapWrap).filter : ''),
                    mapH: mapTarget ? mapTarget.getBoundingClientRect().height : 0,
                    text: main ? main.innerText : '',
                };
            }"""
        )
        assert info["bg"] == "rgb(20, 22, 25)"
        assert info["cols"] == 3, f"Footer grid cols={info['cols']}"
        assert cfg.brand["hotline"] in info["text"]
        assert cfg.brand["email"] in info["text"]
        assert "grayscale" in info["mapFilter"].lower() and "invert" in info["mapFilter"].lower(), f"Map filter={info['mapFilter']}"
        assert abs(info["mapH"] - 200) <= 10
        assert_channel_links_complete(page, ".v2-footer-main", cfg.brand, require_svg=True)
        guard.assert_clean("T1-F09-04")
    finally:
        ctx.close()


@test_case("T1-F09-05", 1, ["F09"], "390x844", "Mobile footer form and grid collapse to 1 column with zero overflow")
def t1_f09_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator("#footer").scroll_into_view_if_needed()
        cols = page.evaluate(
            """() => ({
                formCols: getComputedStyle(document.querySelector('.v2-contact-form')).gridTemplateColumns.split(' ').length,
                gridCols: getComputedStyle(document.querySelector('.v2-footer-grid')).gridTemplateColumns.split(' ').length,
            })"""
        )
        assert cols["formCols"] == 1
        assert cols["gridCols"] == 1
        assert_no_horizontal_overflow(page, "T1-F09-05")
        guard.assert_clean("T1-F09-05")
    finally:
        ctx.close()


# ==============================================================================
# Feature #10: Brand & Sample Media Readiness (F10 — 5 tests)
# ==============================================================================


@test_case("T1-F10-01", 1, ["F10"], "1440x900", "Zero nhuydecor strings or links across all 7 templates")
def t1_f10_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        for path in ["/", "/danh-muc/tat-ca", "/bo-suu-tap", "/du-an", "/thu-vien", "/tin-tuc"]:
            goto_ready(page, f"{cfg.base_url}{path}")
            leaks = page.evaluate(
                """() => {
                    const txt = (document.body.innerText || '').toLowerCase();
                    const metas = Array.from(document.querySelectorAll('meta')).map(m => (m.content || '').toLowerCase()).join(' ');
                    const attrs = Array.from(document.querySelectorAll('a[href], img[src]')).map(e => (e.getAttribute('href') || e.getAttribute('src') || '').toLowerCase()).join(' ');
                    const combined = txt + ' ' + metas + ' ' + attrs;
                    return ['nhuydecor', 'nhuy decor', '0943462335', '0943 462 335'].filter(s => combined.includes(s));
                }"""
            )
            assert not leaks, f"Brand leak on {path}: {leaks}"
        guard.assert_clean("T1-F10-01")
    finally:
        ctx.close()


@test_case("T1-F10-02", 1, ["F10"], "1440x900", "Verify An Gia Decor title, meta description, brand logo, and copyright")
def t1_f10_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        meta = page.evaluate(
            """() => ({
                title: document.title,
                desc: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
                logoLabel: document.querySelector('header a[href="/"]')?.getAttribute('aria-label') || '',
                footerText: document.querySelector('#footer')?.innerText || '',
            })"""
        )
        assert cfg.brand["name"] in meta["title"], f"Title missing brand name: {meta['title']}"
        assert cfg.brand["name"] in meta["desc"], f"Meta description missing brand name: {meta['desc']}"
        assert cfg.brand["name"] in meta["logoLabel"], f"Logo aria-label: {meta['logoLabel']}"
        assert cfg.brand["name"] in meta["footerText"]
        guard.assert_clean("T1-F10-02")
    finally:
        ctx.close()


@test_case("T1-F10-03", 1, ["F10"], "1440x900", "All visible images on / load from local /images/ with naturalWidth > 0")
def t1_f10_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        scroll_and_reveal(page)
        count = assert_all_images_loaded(page, "T1-F10-03")
        assert count > 10
        non_local = page.evaluate(
            """() => Array.from(document.querySelectorAll('img'))
                .map(i => i.getAttribute('src') || '')
                .filter(s => s && !s.startsWith('/images/') && !s.startsWith('data:'))"""
        )
        assert not non_local, f"Unexpected non-local image srcs on /: {non_local}"
        guard.assert_clean("T1-F10-03")
    finally:
        ctx.close()


@test_case("T1-F10-04", 1, ["F10"], "1440x900", "Hero, Spotlight, and Commitment media apply object-fit: cover and scrims")
def t1_f10_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        info = page.evaluate(
            """() => {
                const imgs = Array.from(document.querySelectorAll('.v2-hero img, .v2-hero-cover img, .v2-spotlight img, .v2-commit-stage img'));
                const badFit = imgs.filter(img => getComputedStyle(img).objectFit !== 'cover').map(img => img.src);
                const heroEl = document.querySelector('.v2-hero, .v2-hero-cover');
                const spotEl = document.querySelector('.v2-spotlight.is-overlay .v2-spotlight-picture');
                const heroAfter = heroEl ? getComputedStyle(heroEl, '::after').backgroundImage : '';
                const spotAfter = spotEl ? getComputedStyle(spotEl, '::after').backgroundImage : '';
                return { count: imgs.length, badFit, heroAfter, spotAfter, hasSpot: Boolean(spotEl) };
            }"""
        )
        assert info["count"] >= 3
        assert not info["badFit"], f"Images missing object-fit: cover: {info['badFit']}"
        assert info["hasSpot"], "Missing .v2-spotlight.is-overlay .v2-spotlight-picture"
        assert "gradient" in info["heroAfter"].lower() or page.locator(".v2-hero-scrim").count() > 0
        assert "gradient" in info["spotAfter"].lower()
        guard.assert_clean("T1-F10-04")
    finally:
        ctx.close()


@test_case("T1-F10-05", 1, ["F10"], "1440x900", "Every MegaMenu category links to a non-empty /danh-muc/<slug> catalog")
def t1_f10_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        cat_urls = discover_category_urls(page, cfg.base_url)
        assert len(cat_urls) >= 10
        # Verify a representative sample + ensure every discovered category resolves with >= 1 product
        for href in cat_urls:
            resp = goto_ready(page, f"{cfg.base_url}{href}")
            assert resp is not None and resp.status == 200, f"Category route failed: {href}"
            prod_count = page.locator('.v2-cat-grid a[href^="/san-pham/"]').count()
            assert prod_count >= 1, f"Category {href} rendered 0 products"
        guard.assert_clean("T1-F10-05")
    finally:
        ctx.close()
