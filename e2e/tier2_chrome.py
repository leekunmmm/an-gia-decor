import sys

sys.dont_write_bytecode = True

import math
from playwright.sync_api import Browser

from helpers import (
    RunConfig,
    assert_all_images_loaded,
    assert_no_horizontal_overflow,
    discover_article_url,
    discover_first_product_url,
    discover_news_url,
    goto_ready,
    open_auth_modal,
    open_page,
    scroll_and_reveal,
    test_case,
    wait_for_splash_clear,
)


def _luminance(rgb):
    def ch(c):
        s = c / 255.0
        return s / 12.92 if s <= 0.03928 else ((s + 0.055) / 1.055) ** 2.4

    r, g, b = rgb
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)


def _contrast(rgb1, rgb2):
    l1, l2 = _luminance(rgb1), _luminance(rgb2)
    hi, lo = max(l1, l2), min(l1, l2)
    return (hi + 0.05) / (lo + 0.05)


# ==============================================================================
# Feature #1 Boundary Cases (F01 — 5 tests)
# ==============================================================================


@test_case("T2-F01-01", 2, ["F01"], "320x568", "Ultra-narrow 320px viewport clamps typography and avoids overflow")
def t2_f01_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "320x568")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        m = page.evaluate(
            """() => ({
                wrapW: document.querySelector('.v2-wrap')?.getBoundingClientRect().width || 0,
                heroFs: parseFloat(getComputedStyle(document.querySelector('.v2-hero-title')).fontSize),
                titleFs: parseFloat(getComputedStyle(document.querySelector('.v2-title')).fontSize),
            })"""
        )
        assert abs(m["wrapW"] - 288) <= 20, f"320px .v2-wrap width={m['wrapW']}"
        assert 30 <= m["heroFs"] <= 42, f"320px hero font-size={m['heroFs']}"
        assert 24 <= m["titleFs"] <= 34, f"320px title font-size={m['titleFs']}"
        assert_no_horizontal_overflow(page, "T2-F01-01")
        guard.assert_clean("T2-F01-01")
    finally:
        ctx.close()


@test_case("T2-F01-02", 2, ["F01"], "1920x1080", "Ultrawide 1920px viewport caps .v2-wrap at 1320px and typography scales")
def t2_f01_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1920x1080")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        m = page.evaluate(
            """() => {
                const wrap = document.querySelector('.v2-wrap');
                const r = wrap.getBoundingClientRect();
                return {
                    wrapW: r.width,
                    left: r.left,
                    rightDiff: window.innerWidth - r.right,
                    heroFs: parseFloat(getComputedStyle(document.querySelector('.v2-hero-title')).fontSize),
                    titleFs: parseFloat(getComputedStyle(document.querySelector('.v2-title')).fontSize),
                };
            }"""
        )
        assert abs(m["wrapW"] - 1320) <= 4
        assert abs(m["left"] - m["rightDiff"]) <= 20, "Expected .v2-wrap centered on 1920px"
        assert m["heroFs"] <= 78 and m["titleFs"] <= 58
        guard.assert_clean("T2-F01-02")
    finally:
        ctx.close()


@test_case("T2-F01-03", 2, ["F01"], "1440x900", "Breakpoint transition 1100px -> 1099px switches header cleanly")
def t2_f01_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1100x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        top_1100 = page.locator(".v2-header-top").evaluate("el => getComputedStyle(el).display")
        assert top_1100 != "none", "Expected desktop top bar visible at 1100px"
        page.set_viewport_size({"width": 1099, "height": 900})
        page.wait_for_timeout(150)
        top_1099 = page.locator(".v2-header-top").evaluate("el => getComputedStyle(el).display")
        bar_1099 = page.locator(".v2-header-bar").evaluate("el => el.getBoundingClientRect().height")
        assert top_1099 == "none", "Expected desktop top bar hidden at 1099px"
        assert abs(bar_1099 - 64) <= 2, f"Expected 64px mobile bar at 1099px, got {bar_1099}"
        assert_no_horizontal_overflow(page, "T2-F01-03")
        guard.assert_clean("T2-F01-03")
    finally:
        ctx.close()


@test_case("T2-F01-04", 2, ["F01"], "1440x900", "Breakpoint transition 768px -> 767px switches .v2-wrap gutters cleanly")
def t2_f01_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "768x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        w_768 = page.locator(".v2-wrap").first.evaluate("el => el.getBoundingClientRect().width")
        assert abs(w_768 - (768 - 96)) <= 20, f"768px wrap width={w_768}"
        page.set_viewport_size({"width": 767, "height": 900})
        page.wait_for_timeout(150)
        w_767 = page.locator(".v2-wrap").first.evaluate("el => el.getBoundingClientRect().width")
        assert abs(w_767 - (767 - 32)) <= 20, f"767px wrap width={w_767}"
        assert_no_horizontal_overflow(page, "T2-F01-04")
        guard.assert_clean("T2-F01-04")
    finally:
        ctx.close()


@test_case("T2-F01-05", 2, ["F01"], "1440x900", "Verify dark/light surface WCAG contrast ratios for brand gold & white text")
def t2_f01_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        assert _contrast((138, 101, 16), (246, 246, 246)) >= 4.5
        assert _contrast((255, 255, 255), (41, 45, 52)) >= 4.5
        assert _contrast((226, 173, 33), (20, 22, 25)) >= 4.5
        # Confirm DreamSpaces light card actually uses legible dark/gold-ink text
        dream_gold = page.locator("#rooms .v2-dream-line strong").first.evaluate("el => getComputedStyle(el).color")
        dream_ink = page.locator("#rooms .v2-dream-title h2").first.evaluate("el => getComputedStyle(el).color")
        assert dream_gold == "rgb(138, 101, 16)", f"DreamSpaces gold-ink color={dream_gold}"
        assert dream_ink in ("rgb(17, 17, 17)", "rgb(20, 22, 25)"), f"DreamSpaces heading color={dream_ink}"
        guard.assert_clean("T2-F01-05")
    finally:
        ctx.close()


# ==============================================================================
# Feature #2 Boundary Cases (F02 — 5 tests)
# ==============================================================================


@test_case("T2-F02-01", 2, ["F02"], "1440x900", "Instant jump top -> footer reveals visible footer [data-reveal] elements")
def t2_f02_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.evaluate("window.scrollTo(0, document.documentElement.scrollHeight)")
        page.wait_for_timeout(850)
        stuck = page.evaluate(
            """() => Array.from(document.querySelectorAll('#footer .v2-reveal, #footer [data-reveal]'))
                .filter(el => parseFloat(getComputedStyle(el).opacity) < 0.9)
                .map(el => el.className)"""
        )
        assert not stuck, f"Footer reveal elements stuck invisible after instant scroll: {stuck}"
        guard.assert_clean("T2-F02-01")
    finally:
        ctx.close()


@test_case("T2-F02-02", 2, ["F02"], "1440x900", "Deep-link /#rooms immediately reveals DreamSpaces card and .v2-hotspots")
def t2_f02_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/#rooms")
        page.wait_for_timeout(850)
        op = page.locator("#rooms .v2-hotspots").first.evaluate("el => parseFloat(getComputedStyle(el).opacity)")
        assert op >= 0.9, f"#rooms hotspots opacity={op}"
        guard.assert_clean("T2-F02-02")
    finally:
        ctx.close()


@test_case("T2-F02-03", 2, ["F02"], "1440x900", "Reduced motion on /bo-suu-tap shows all .v2-bst-card immediately at opacity=1")
def t2_f02_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900", reduced_motion=True)
    try:
        goto_ready(page, f"{cfg.base_url}/bo-suu-tap")
        page.wait_for_timeout(200)
        ops = page.evaluate(
            "() => Array.from(document.querySelectorAll('.v2-bst-card')).map(el => parseFloat(getComputedStyle(el).opacity))"
        )
        assert len(ops) >= 2 and all(o >= 0.95 for o in ops), f"Reduced-motion /bo-suu-tap card opacities={ops}"
        guard.assert_clean("T2-F02-03")
    finally:
        ctx.close()


@test_case("T2-F02-04", 2, ["F02"], "1440x900", "Browser Back navigation restores RevealObserver on /")
def t2_f02_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator('header a[href="/du-an"]').first.click()
        page.wait_for_url("**/du-an", timeout=10000)
        page.go_back(wait_until="domcontentloaded")
        page.wait_for_timeout(300)
        scroll_and_reveal(page, step_px=700, pause_ms=80)
        stuck = page.evaluate(
            """() => Array.from(document.querySelectorAll('.v2-reveal, [data-reveal]'))
                .filter(el => getComputedStyle(el).display !== 'none' && parseFloat(getComputedStyle(el).opacity) < 0.9).length"""
        )
        assert stuck == 0, f"{stuck} elements stuck invisible after browser Back"
        guard.assert_clean("T2-F02-04")
    finally:
        ctx.close()


@test_case("T2-F02-05", 2, ["F02"], "390x844", "Mobile short 844px viewport triggers reveals for tall sections")
def t2_f02_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        scroll_and_reveal(page, step_px=450, pause_ms=90)
        stuck = page.evaluate(
            """() => Array.from(document.querySelectorAll('.v2-reveal, [data-reveal], .v2-hotspots'))
                .filter(el => getComputedStyle(el).display !== 'none' && parseFloat(getComputedStyle(el).opacity) < 0.9).length"""
        )
        assert stuck == 0, f"{stuck} elements stuck invisible on 390x844 mobile scroll"
        guard.assert_clean("T2-F02-05")
    finally:
        ctx.close()


# ==============================================================================
# Feature #3 Boundary Cases (F03 — 5 tests)
# ==============================================================================


@test_case("T2-F03-01", 2, ["F03"], "1440x900", "Reduced motion skips PreloaderSplash immediately (<500ms)")
def t2_f03_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900", skip_splash=False, reduced_motion=True)
    try:
        page.goto(f"{cfg.base_url}/", wait_until="domcontentloaded", timeout=20000)
        wait_for_splash_clear(page, timeout_ms=500)
        guard.assert_clean("T2-F03-01")
    finally:
        ctx.close()


@test_case("T2-F03-02", 2, ["F03"], "1440x900", "Rapid double-click on .ny-splash produces no race errors")
def t2_f03_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900", skip_splash=False)
    try:
        page.goto(f"{cfg.base_url}/", wait_until="domcontentloaded", timeout=20000)
        splash = page.locator(".ny-splash")
        splash.wait_for(state="visible", timeout=3000)
        splash.dblclick()
        wait_for_splash_clear(page, timeout_ms=1500)
        guard.assert_clean("T2-F03-02")
    finally:
        ctx.close()


@test_case("T2-F03-03", 2, ["F03"], "1440x900", "Invalid 404 route in fresh context clears splash and shows return-home link")
def t2_f03_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900", skip_splash=False, expect_404=True)
    try:
        page.goto(f"{cfg.base_url}/khong-ton-tai-xyz", wait_until="domcontentloaded", timeout=20000)
        wait_for_splash_clear(page, timeout_ms=4500)
        assert page.locator('a[href="/"]').count() >= 1
        guard.assert_clean("T2-F03-03")
    finally:
        ctx.close()


@test_case("T2-F03-04", 2, ["F03"], "1440x900", "Blocked sessionStorage SecurityError does not trap or crash splash")
def t2_f03_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900", skip_splash=False)
    try:
        ctx.add_init_script(
            """Object.defineProperty(window, 'sessionStorage', {
                get() { throw new DOMException('Blocked', 'SecurityError'); }
            });"""
        )
        page.goto(f"{cfg.base_url}/", wait_until="domcontentloaded", timeout=20000)
        wait_for_splash_clear(page, timeout_ms=4500)
        guard.assert_clean("T2-F03-04")
    finally:
        ctx.close()


@test_case("T2-F03-05", 2, ["F03"], "390x844", "Mobile fresh load scales .ny-splash-svg cleanly with zero overflow")
def t2_f03_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844", skip_splash=False)
    try:
        page.goto(f"{cfg.base_url}/", wait_until="domcontentloaded", timeout=20000)
        svg = page.locator(".ny-splash-svg")
        svg.wait_for(state="visible", timeout=3000)
        box = svg.bounding_box()
        assert box is not None and 88 <= box["width"] <= 136
        assert_no_horizontal_overflow(page, "T2-F03-05")
        wait_for_splash_clear(page, timeout_ms=4500)
        guard.assert_clean("T2-F03-05")
    finally:
        ctx.close()


# ==============================================================================
# Feature #4 Boundary Cases (F04 — 6 tests)
# ==============================================================================


@test_case("T2-F04-01", 2, ["F04"], "1440x900", "Scroll jitter 0 -> 120 -> 0 leaves header clean without .is-hidden lock")
def t2_f04_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        for y in (120, 40, 150, 0):
            page.evaluate(f"window.scrollTo(0, {y})")
            page.wait_for_timeout(100)
        cls = page.locator(".v2-header").get_attribute("class") or ""
        assert "is-hidden" not in cls and "is-scrolled" not in cls, f"Header class after return to top: {cls}"
        guard.assert_clean("T2-F04-01")
    finally:
        ctx.close()


@test_case("T2-F04-02", 2, ["F04"], "1440x900", "Jump from page bottom to scrollTo(0, 0) restores unscrolled header")
def t2_f04_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.evaluate("window.scrollTo(0, document.documentElement.scrollHeight)")
        page.wait_for_timeout(200)
        page.evaluate("window.scrollTo(0, 0)")
        page.wait_for_timeout(250)
        top = page.locator(".v2-header").evaluate("el => el.getBoundingClientRect().top")
        cls = page.locator(".v2-header").get_attribute("class") or ""
        assert abs(top) <= 2 and "is-hidden" not in cls and "is-scrolled" not in cls
        guard.assert_clean("T2-F04-02")
    finally:
        ctx.close()


@test_case("T2-F04-03", 2, ["F04"], "390x844", "Open mobile drawer then resize to 1440x900 restores desktop header & scroll")
def t2_f04_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator(".v2-burger, header button[aria-label*='menu' i]").first.click()
        page.locator(".v2-mobile-menu").wait_for(state="visible", timeout=4000)
        page.set_viewport_size({"width": 1440, "height": 900})
        page.wait_for_timeout(250)
        drawer_vis = page.locator(".v2-mobile-menu").is_visible() if page.locator(".v2-mobile-menu").count() else False
        assert not drawer_vis, "Mobile drawer should hide/close when resizing to 1440px desktop"
        overflow = page.evaluate("() => getComputedStyle(document.body).overflow")
        assert overflow != "hidden", f"Body scroll remained locked after resize: overflow={overflow}"
        guard.assert_clean("T2-F04-03")
    finally:
        ctx.close()


@test_case("T2-F04-04", 2, ["F04"], "390x844", "Click link inside mobile drawer closes drawer and leaves target scrollable")
def t2_f04_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator(".v2-burger, header button[aria-label*='menu' i]").first.click()
        drawer = page.locator(".v2-mobile-menu")
        drawer.wait_for(state="visible", timeout=4000)
        drawer.locator('a[href="/bo-suu-tap"]').first.click()
        page.wait_for_url("**/bo-suu-tap", timeout=10000)
        page.wait_for_timeout(200)
        assert page.locator(".v2-mobile-menu").count() == 0 or not page.locator(".v2-mobile-menu").is_visible()
        page.evaluate("window.scrollTo(0, 400)")
        assert page.evaluate("() => window.scrollY") > 100
        guard.assert_clean("T2-F04-04")
    finally:
        ctx.close()


@test_case("T2-F04-05", 2, ["F04"], "1440x900", "Header ::before scrim active at y=0 and backdrop-filter active when scrolled")
def t2_f04_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        scrim = page.locator(".v2-header").evaluate("el => getComputedStyle(el, '::before').backgroundImage")
        assert "gradient" in scrim.lower(), f"Expected header top scrim gradient, got {scrim}"
        page.evaluate("window.scrollTo(0, 400)")
        page.wait_for_timeout(380)
        bf = page.locator(".v2-header-bar").evaluate("el => getComputedStyle(el).backdropFilter || getComputedStyle(el).webkitBackdropFilter || ''")
        assert "blur" in bf.lower()
        guard.assert_clean("T2-F04-05")
    finally:
        ctx.close()


@test_case("T2-F04-06", 2, ["F04"], "390x844", "Repeatedly toggling Sản phẩm inside mobile drawer does not overlap hotline")
def t2_f04_06(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator(".v2-burger, header button[aria-label*='menu' i]").first.click()
        drawer = page.locator(".v2-mobile-menu")
        drawer.wait_for(state="visible", timeout=4000)
        prod_btn = drawer.locator("button", has_text="Sản phẩm").first
        prod_btn.click()
        page.wait_for_timeout(150)
        prod_btn.click()
        page.wait_for_timeout(150)
        prod_btn.click()
        page.wait_for_timeout(150)
        assert drawer.locator('a[href^="tel:"]').first.is_visible()
        assert_no_horizontal_overflow(page, "T2-F04-06")
        guard.assert_clean("T2-F04-06")
    finally:
        ctx.close()


# ==============================================================================
# Feature #5 Boundary Cases (F05 — 5 tests)
# ==============================================================================


@test_case("T2-F05-01", 2, ["F05"], "1440x900", "Pressing Escape closes MegaMenu and resets aria-expanded=false")
def t2_f05_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        btn = page.locator("header button", has_text="Sản phẩm").first
        btn.click()
        page.locator(".v2-mega").wait_for(state="visible", timeout=4000)
        page.keyboard.press("Escape")
        page.wait_for_timeout(150)
        assert page.locator(".v2-mega").count() == 0
        assert btn.get_attribute("aria-expanded") == "false"
        guard.assert_clean("T2-F05-01")
    finally:
        ctx.close()


@test_case("T2-F05-02", 2, ["F05"], "1440x900", "Opening SearchOverlay while MegaMenu open enforces mutual exclusion")
def t2_f05_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator("header button", has_text="Sản phẩm").first.click()
        page.locator(".v2-mega").wait_for(state="visible", timeout=4000)
        # Click Search via JS/header if MegaMenu covers or close btn
        search_btn = page.locator('.v2-header button[aria-label*="Tìm kiếm" i]:visible').first
        search_btn.dispatch_event("click")
        page.wait_for_timeout(200)
        assert page.locator(".v2-search").is_visible()
        assert page.locator(".v2-mega").count() == 0, "MegaMenu and SearchOverlay must be mutually exclusive"
        guard.assert_clean("T2-F05-02")
    finally:
        ctx.close()


@test_case("T2-F05-03", 2, ["F05"], "1440x900", "Keyboard Tab/Enter navigation across .v2-mega-rooms works cleanly")
def t2_f05_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator("header button", has_text="Sản phẩm").first.click()
        page.locator(".v2-mega").wait_for(state="visible", timeout=4000)
        btn2 = page.locator(".v2-mega-rooms li button").nth(1)
        btn2.focus()
        page.keyboard.press("Enter")
        page.wait_for_timeout(100)
        assert "is-active" in (page.locator(".v2-mega-rooms li").nth(1).get_attribute("class") or "")
        guard.assert_clean("T2-F05-03")
    finally:
        ctx.close()


@test_case("T2-F05-04", 2, ["F05"], "1440x900", "Scrolling .v2-mega-rooms does not scroll background page")
def t2_f05_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator("header button", has_text="Sản phẩm").first.click()
        page.locator(".v2-mega").wait_for(state="visible", timeout=4000)
        y_before = page.evaluate("() => window.scrollY")
        rooms = page.locator(".v2-mega-rooms")
        rooms.hover()
        page.mouse.wheel(0, 400)
        page.wait_for_timeout(150)
        y_after = page.evaluate("() => window.scrollY")
        assert y_after == y_before, f"Background body scrolled while scrolling MegaMenu ({y_before} -> {y_after})"
        guard.assert_clean("T2-F05-04")
    finally:
        ctx.close()


@test_case("T2-F05-05", 2, ["F05"], "390x844", "Mobile MegaMenu / drawer collapse and close restores page scroll")
def t2_f05_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        burger = page.locator(".v2-burger, header button[aria-label*='menu' i]").first
        burger.click()
        drawer = page.locator(".v2-mobile-menu")
        drawer.wait_for(state="visible", timeout=4000)
        drawer.locator("button", has_text="Sản phẩm").first.click()
        page.wait_for_timeout(150)
        burger.click()
        page.wait_for_timeout(150)
        page.evaluate("window.scrollTo(0, 400)")
        assert page.evaluate("() => window.scrollY") > 100
        guard.assert_clean("T2-F05-05")
    finally:
        ctx.close()


# ==============================================================================
# Feature #6 Boundary Cases (F06 — 5 tests)
# ==============================================================================


@test_case("T2-F06-01", 2, ["F06"], "1440x900", "Gibberish search query displays Vietnamese empty-state message")
def t2_f06_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator('.v2-header button[aria-label*="Tìm kiếm" i]:visible').first.click()
        page.locator(".v2-search input").first.fill("zzzzqqqq9999")
        page.wait_for_timeout(150)
        txt = page.locator(".v2-search-box").inner_text().lower()
        assert "không tìm thấy" in txt
        assert page.locator('.v2-search a[href^="/san-pham/"]').count() == 0
        guard.assert_clean("T2-F06-01")
    finally:
        ctx.close()


@test_case("T2-F06-02", 2, ["F06"], "1440x900", "Whitespace-only query does not break search and clearing restores defaults")
def t2_f06_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator('.v2-header button[aria-label*="Tìm kiếm" i]:visible').first.click()
        inp = page.locator(".v2-search input").first
        inp.fill("   ")
        page.wait_for_timeout(120)
        inp.fill("")
        page.wait_for_timeout(120)
        assert page.locator('.v2-search a[href^="/san-pham/"]').count() >= 1
        guard.assert_clean("T2-F06-02")
    finally:
        ctx.close()


@test_case("T2-F06-03", 2, ["F06"], "1440x900", "XSS payload in SearchOverlay renders strictly as escaped text")
def t2_f06_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    dialogs = []
    page.on("dialog", lambda d: (dialogs.append(d.message), d.dismiss()))
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator('.v2-header button[aria-label*="Tìm kiếm" i]:visible').first.click()
        payload = "<script>alert(1)</script>"
        page.locator(".v2-search input").first.fill(payload)
        page.wait_for_timeout(150)
        assert not dialogs, f"XSS alert triggered: {dialogs}"
        assert payload in page.locator(".v2-search-box").inner_text()
        guard.assert_clean("T2-F06-03")
    finally:
        ctx.close()


@test_case("T2-F06-04", 2, ["F06"], "1440x900", "Pressing Escape or clicking backdrop closes SearchOverlay")
def t2_f06_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        btn = page.locator('.v2-header button[aria-label*="Tìm kiếm" i]:visible').first
        btn.click()
        page.locator(".v2-search").wait_for(state="visible", timeout=4000)
        page.keyboard.press("Escape")
        page.wait_for_timeout(150)
        assert page.locator(".v2-search").count() == 0
        btn.click()
        page.locator(".v2-search").wait_for(state="visible", timeout=4000)
        page.mouse.click(10, 10)
        page.wait_for_timeout(150)
        assert page.locator(".v2-search").count() == 0
        guard.assert_clean("T2-F06-04")
    finally:
        ctx.close()


@test_case("T2-F06-05", 2, ["F06"], "1440x900", "Very long 120-character search query does not overflow .v2-search-box")
def t2_f06_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator('.v2-header button[aria-label*="Tìm kiếm" i]:visible').first.click()
        page.locator(".v2-search input").first.fill("sofa-" * 24)
        page.wait_for_timeout(150)
        ov = page.locator(".v2-search-box").evaluate("el => el.scrollWidth > el.clientWidth + 2")
        assert not ov, ".v2-search-box overflowed horizontally with 120-char query"
        guard.assert_clean("T2-F06-05")
    finally:
        ctx.close()


# ==============================================================================
# Feature #7 Boundary Cases (F07 — 5 tests)
# ==============================================================================


@test_case("T2-F07-01", 2, ["F07"], "1440x900", "Submitting empty login form displays client-side Vietnamese UI errors")
def t2_f07_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        dlg = open_auth_modal(page, tab="login")
        dlg.locator('form button[type="submit"]').click()
        page.wait_for_timeout(150)
        err_count = dlg.locator(".auth-error, .auth-field.has-error, [aria-invalid='true']").count()
        assert err_count >= 1, "Expected explicit client-side UI validation error elements (.auth-error / .has-error / aria-invalid)"
        assert page.evaluate("() => window.localStorage.getItem('ag_demo_user')") is None
        guard.assert_clean("T2-F07-01")
    finally:
        ctx.close()


@test_case("T2-F07-02", 2, ["F07"], "1440x900", "Invalid email format and short password trigger explicit UI errors")
def t2_f07_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        dlg = open_auth_modal(page, tab="login")
        dlg.locator('form input[type="email"]').fill("khonghople@")
        dlg.locator('form input[type="password"]').fill("123")
        dlg.locator('form button[type="submit"]').click()
        page.wait_for_timeout(150)
        assert dlg.locator(".auth-error, [aria-invalid='true']").count() >= 2
        assert page.evaluate("() => window.localStorage.getItem('ag_demo_user')") is None
        guard.assert_clean("T2-F07-02")
    finally:
        ctx.close()


@test_case("T2-F07-03", 2, ["F07"], "1440x900", "Register tab mismatched passwords render explicit UI error and block submit")
def t2_f07_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        dlg = open_auth_modal(page, tab="register")
        dlg.locator('form input[type="text"]').first.fill("Nguyễn Văn A")
        dlg.locator('form input[type="email"]').first.fill("khach@angiadecor.vn")
        tel = dlg.locator('form input[type="tel"]')
        if tel.count() > 0:
            tel.first.fill("0908123456")
        pwds = dlg.locator('form input[type="password"]')
        assert pwds.count() >= 2, "Expected Mật khẩu and Nhập lại mật khẩu fields"
        pwds.nth(0).fill("Matkhau123")
        pwds.nth(1).fill("Khacnhau999")
        dlg.locator('form button[type="submit"]').click()
        page.wait_for_timeout(150)
        assert dlg.locator(".auth-error, [aria-invalid='true']").count() >= 1
        assert page.evaluate("() => window.localStorage.getItem('ag_demo_user')") is None
        guard.assert_clean("T2-F07-03")
    finally:
        ctx.close()


@test_case("T2-F07-04", 2, ["F07"], "1440x900", "Escape or overlay click closes AuthModal without storing partial data")
def t2_f07_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        open_auth_modal(page, tab="login")
        page.keyboard.press("Escape")
        page.wait_for_timeout(150)
        assert page.locator(".auth-dialog").count() == 0
        assert page.evaluate("() => window.localStorage.getItem('ag_demo_user')") is None
        guard.assert_clean("T2-F07-04")
    finally:
        ctx.close()


@test_case("T2-F07-05", 2, ["F07"], "390x844", "Mobile AuthModal Register form fits viewport and submit stays reachable")
def t2_f07_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        dlg = open_auth_modal(page, tab="register")
        box = dlg.bounding_box()
        assert box is not None and box["height"] <= 830
        submit = dlg.locator('form button[type="submit"]')
        submit.scroll_into_view_if_needed()
        assert submit.is_visible()
        guard.assert_clean("T2-F07-05")
    finally:
        ctx.close()


# ==============================================================================
# Feature #8 Boundary Cases (F08 — 5 tests)
# ==============================================================================


@test_case("T2-F08-01", 2, ["F08"], "1440x900", "Closed .ny-contact-actions has pointer-events: none and opacity: 0")
def t2_f08_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        st = page.evaluate(
            """() => {
                const act = document.querySelector('.ny-contact-actions');
                if (!act) return { absent: true };
                const s = getComputedStyle(act);
                const firstItem = act.querySelector('.ny-contact-action, a');
                const itemOp = firstItem ? parseFloat(getComputedStyle(firstItem).opacity) : 0;
                return { absent: false, pe: s.pointerEvents, itemOp };
            }"""
        )
        assert st["absent"] or (st["pe"] == "none" and st["itemOp"] == 0), (
            f"Closed FAB actions must not intercept clicks: {st}"
        )
        guard.assert_clean("T2-F08-01")
    finally:
        ctx.close()


@test_case("T2-F08-02", 2, ["F08"], "1440x900", "Rapid double-click on .ny-contact-trigger toggles open -> close cleanly")
def t2_f08_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        trig = page.locator(".ny-contact-trigger")
        trig.dblclick()
        page.wait_for_timeout(150)
        assert trig.get_attribute("aria-expanded") == "false"
        assert "is-open" not in (page.locator(".ny-contact-launcher").get_attribute("class") or "")
        guard.assert_clean("T2-F08-02")
    finally:
        ctx.close()


@test_case("T2-F08-03", 2, ["F08"], "1440x900", "Escape or outside click dismisses open FloatingActions launcher")
def t2_f08_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        trig = page.locator(".ny-contact-trigger")
        trig.click()
        page.wait_for_timeout(150)
        assert trig.get_attribute("aria-expanded") == "true"
        page.keyboard.press("Escape")
        page.wait_for_timeout(150)
        assert trig.get_attribute("aria-expanded") == "false", "Expected Escape to dismiss FloatingActions"
        guard.assert_clean("T2-F08-03")
    finally:
        ctx.close()


@test_case("T2-F08-04", 2, ["F08"], "1440x900", "Back-to-top .v2-pd-top hidden at y=0 and positioned above FAB when scrolled")
def t2_f08_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        cls0 = page.locator(".v2-pd-top").get_attribute("class") or ""
        assert "is-shown" not in cls0
        page.evaluate("window.scrollTo(0, 700)")
        page.wait_for_timeout(200)
        top_box = page.locator(".v2-pd-top").bounding_box()
        fab_box = page.locator(".ny-contact-trigger").bounding_box()
        assert top_box["y"] + top_box["height"] < fab_box["y"], "Back-to-top overlaps FAB trigger"
        guard.assert_clean("T2-F08-04")
    finally:
        ctx.close()


@test_case("T2-F08-05", 2, ["F08"], "390x844", "Mobile FloatingActions and back-to-top stay within 390x844 safe margins")
def t2_f08_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.evaluate("window.scrollTo(0, 700)")
        page.wait_for_timeout(200)
        fab_box = page.locator(".ny-contact-trigger").bounding_box()
        assert fab_box["x"] + fab_box["width"] <= 390 - 10
        assert fab_box["y"] + fab_box["height"] <= 844 - 10
        assert_no_horizontal_overflow(page, "T2-F08-05")
        guard.assert_clean("T2-F08-05")
    finally:
        ctx.close()


# ==============================================================================
# Feature #9 Boundary Cases (F09 — 5 tests)
# ==============================================================================


@test_case("T2-F09-01", 2, ["F09"], "1440x900", "Submitting empty Footer form renders client-side aria-invalid & .v2-cf-error")
def t2_f09_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        form = page.locator(".v2-contact-form")
        form.scroll_into_view_if_needed()
        form.locator(".v2-cf-send").click()
        page.wait_for_timeout(150)
        assert form.locator('[aria-invalid="true"]').count() >= 3, "Expected aria-invalid='true' on empty required fields"
        assert form.locator(".v2-cf-error").count() >= 1, "Expected visible .v2-cf-error messages"
        guard.assert_clean("T2-F09-01")
    finally:
        ctx.close()


@test_case("T2-F09-02", 2, ["F09"], "1440x900", "Invalid email 'abc' and phone '12' in Footer form trigger field errors")
def t2_f09_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        form = page.locator(".v2-contact-form")
        form.scroll_into_view_if_needed()
        form.locator('input[type="text"]').first.fill("Trần Tuấn")
        form.locator('input[type="email"]').fill("abc")
        form.locator('input[type="tel"]').fill("12")
        form.locator(".v2-cf-send").click()
        page.wait_for_timeout(150)
        assert form.locator('input[type="email"]').get_attribute("aria-invalid") == "true"
        assert form.locator('input[type="tel"]').get_attribute("aria-invalid") == "true"
        guard.assert_clean("T2-F09-02")
    finally:
        ctx.close()


@test_case("T2-F09-03", 2, ["F09"], "1440x900", "Footer floating label rises when filled and returns when cleared")
def t2_f09_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        field = page.locator(".v2-cf-field").first
        field.scroll_into_view_if_needed()
        inp = field.locator("input").first
        lbl = field.locator("span").first
        idle_y = lbl.bounding_box()["y"]
        inp.fill("Test")
        inp.blur()
        page.wait_for_timeout(400)
        filled_y = lbl.bounding_box()["y"]
        assert filled_y < idle_y - 3
        inp.fill("")
        inp.blur()
        page.wait_for_timeout(400)
        cleared_y = lbl.bounding_box()["y"]
        assert abs(cleared_y - idle_y) <= 4
        guard.assert_clean("T2-F09-03")
    finally:
        ctx.close()


@test_case("T2-F09-04", 2, ["F09"], "1440x900", "Footer form submits cleanly when optional Công ty field is blank")
def t2_f09_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        form = page.locator(".v2-contact-form")
        form.scroll_into_view_if_needed()
        form.locator('input[type="text"]').first.fill("Lê Hoàng")
        form.locator('input[type="email"]').fill("hoang@example.com")
        form.locator('input[type="tel"]').fill("0909123456")
        form.locator(".v2-cf-send").click()
        page.wait_for_timeout(200)
        assert "cảm ơn" in page.locator("#footer").inner_text().lower()
        guard.assert_clean("T2-F09-04")
    finally:
        ctx.close()


@test_case("T2-F09-05", 2, ["F09"], "1440x900", "Footer map iframe has title, loading=lazy, ~200px height, and filter")
def t2_f09_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        iframe = page.locator(".v2-footer-map iframe, iframe.v2-footer-map").first
        iframe.scroll_into_view_if_needed()
        info = iframe.evaluate(
            """el => ({
                title: el.getAttribute('title') || '',
                loading: el.getAttribute('loading') || '',
                h: el.getBoundingClientRect().height,
                filter: getComputedStyle(el).filter,
            })"""
        )
        assert info["title"]
        assert info["loading"] == "lazy"
        assert abs(info["h"] - 200) <= 10
        assert "grayscale" in info["filter"].lower()
        guard.assert_clean("T2-F09-05")
    finally:
        ctx.close()


# ==============================================================================
# Feature #10 Boundary Cases (F10 — 5 tests)
# ==============================================================================


@test_case("T2-F10-01", 2, ["F10"], "1440x900", "Zero broken images across all 6 inner page templates")
def t2_f10_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        prod_url = discover_first_product_url(page, cfg.base_url)
        art_url = discover_article_url(page, cfg.base_url)
        news_url = discover_news_url(page, cfg.base_url)
        for route in ["/danh-muc/tat-ca", prod_url, "/bo-suu-tap", "/du-an", "/thu-vien", art_url, "/tin-tuc", news_url]:
            goto_ready(page, f"{cfg.base_url}{route}")
            scroll_and_reveal(page, step_px=700, pause_ms=60)
            assert_all_images_loaded(page, f"T2-F10-01:{route}")
        guard.assert_clean("T2-F10-01")
    finally:
        ctx.close()


@test_case("T2-F10-02", 2, ["F10"], "1440x900", "Wide media stages enforce object-fit: cover with zero letterbox gaps")
def t2_f10_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        bad = page.evaluate(
            """() => Array.from(document.querySelectorAll('.v2-spotlight img, .v2-commit-stage img, .v2-space-stage img'))
                .filter(img => getComputedStyle(img).objectFit !== 'cover')
                .map(img => img.src)"""
        )
        assert not bad, f"Images missing object-fit: cover: {bad}"
        guard.assert_clean("T2-F10-02")
    finally:
        ctx.close()


@test_case("T2-F10-03", 2, ["F10"], "1440x900", "Every external target=_blank link includes rel containing noopener")
def t2_f10_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator(".ny-contact-trigger").click()
        bad = page.evaluate(
            """() => Array.from(document.querySelectorAll('a[target="_blank"]'))
                .filter(a => !(a.getAttribute('rel') || '').toLowerCase().includes('noopener'))
                .map(a => a.getAttribute('href'))"""
        )
        assert not bad, f"External target=_blank links missing rel=noopener: {bad}"
        guard.assert_clean("T2-F10-03")
    finally:
        ctx.close()


@test_case("T2-F10-04", 2, ["F10"], "1440x900", "Network guard records 0 requests to nhuydecor.vn across full navigation")
def t2_f10_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        for route in ["/", "/danh-muc/tat-ca", "/bo-suu-tap", "/du-an", "/thu-vien", "/tin-tuc"]:
            goto_ready(page, f"{cfg.base_url}{route}")
        assert not guard.forbidden_requests, f"Forbidden requests to nhuydecor: {guard.forbidden_requests}"
        guard.assert_clean("T2-F10-04")
    finally:
        ctx.close()


@test_case("T2-F10-05", 2, ["F10"], "1440x900", "Non-existent route /duong-dan-sai-404 renders An Gia Decor 404 UI")
def t2_f10_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900", expect_404=True)
    try:
        resp = goto_ready(page, f"{cfg.base_url}/duong-dan-sai-404")
        assert resp is not None and resp.status == 404
        assert "404" in page.locator("body").inner_text()
        assert page.locator('a[href="/"]').count() >= 1
        guard.assert_clean("T2-F10-05")
    finally:
        ctx.close()
