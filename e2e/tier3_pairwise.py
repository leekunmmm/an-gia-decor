import sys

sys.dont_write_bytecode = True

from playwright.sync_api import Browser

from helpers import (
    RunConfig,
    assert_all_images_loaded,
    assert_channel_links_complete,
    assert_no_horizontal_overflow,
    discover_article_url,
    discover_first_product_url,
    discover_news_url,
    goto_ready,
    open_auth_modal,
    open_page,
    scroll_and_reveal,
    test_case,
    verify_video_ready_slot,
    wait_for_splash_clear,
)


@test_case("T3-01", 3, ["F04", "F18"], "1440x900", "Header scroll-hide + ProductDetail sticky breadcrumb (100px <-> 60px)")
def t3_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        prod = discover_first_product_url(page, cfg.base_url)
        goto_ready(page, f"{cfg.base_url}{prod}")
        page.evaluate("window.scrollTo(0, 620)")
        page.wait_for_timeout(300)
        assert "is-hidden" in (page.locator(".v2-header").get_attribute("class") or "")
        top_down = page.evaluate("() => document.querySelector('.v2-pd-crumbs.is-pinned')?.getBoundingClientRect().top")
        assert top_down is not None and abs(top_down - 60) <= 3
        page.evaluate("window.scrollBy(0, -120)")
        page.wait_for_timeout(300)
        assert "is-hidden" not in (page.locator(".v2-header").get_attribute("class") or "")
        top_up = page.evaluate("() => document.querySelector('.v2-pd-crumbs.is-pinned')?.getBoundingClientRect().top")
        assert top_up is not None and abs(top_up - 100) <= 3
        guard.assert_clean("T3-01")
    finally:
        ctx.close()


@test_case("T3-02", 3, ["F05", "F17", "F18", "F08"], "1440x900", "MegaMenu -> Catalog -> ProductDetail -> 4 SVG Channel CTAs")
def t3_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator("header button", has_text="Sản phẩm").first.click()
        page.locator(".v2-mega").wait_for(state="visible", timeout=4000)
        page.locator('.v2-mega-items a[href^="/danh-muc/"]').first.click()
        page.wait_for_url("**/danh-muc/**", timeout=10000)
        page.locator('.v2-cat-grid a[href^="/san-pham/"]').first.click()
        page.wait_for_url("**/san-pham/**", timeout=10000)
        assert_channel_links_complete(page, ".v2-pd-contact", cfg.brand, require_svg=True)
        guard.assert_clean("T3-02")
    finally:
        ctx.close()


@test_case("T3-03", 3, ["F06", "F18"], "1440x900", "SearchOverlay unaccented query -> ProductDetail")
def t3_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator('.v2-header button[aria-label*="Tìm kiếm" i]:visible').first.click()
        page.locator(".v2-search input").first.fill("ban tra")
        page.wait_for_timeout(150)
        res = page.locator('.v2-search a[href^="/san-pham/"]').first
        href = res.get_attribute("href")
        res.click()
        page.wait_for_url(f"**{href}", timeout=10000)
        assert page.locator(".v2-pd-stage").is_visible()
        assert page.locator(".v2-pd-facts").is_visible()
        guard.assert_clean("T3-03")
    finally:
        ctx.close()


@test_case("T3-04", 3, ["F04", "F05", "F06"], "1440x900", "Header + MegaMenu + SearchOverlay mutual exclusion")
def t3_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator("header button", has_text="Sản phẩm").first.click()
        page.locator(".v2-mega").wait_for(state="visible", timeout=4000)
        assert "is-mega" in (page.locator(".v2-header").get_attribute("class") or "")
        page.locator('.v2-header button[aria-label*="Tìm kiếm" i]:visible').first.dispatch_event("click")
        page.locator(".v2-search").wait_for(state="visible", timeout=4000)
        assert page.locator(".v2-mega").count() == 0
        page.keyboard.press("Escape")
        page.wait_for_timeout(150)
        assert page.locator(".v2-search").count() == 0
        guard.assert_clean("T3-04")
    finally:
        ctx.close()


@test_case("T3-05", 3, ["F04", "F07", "F18"], "1440x900", "AuthModal sign-in + Product wishlist persistence across navigation")
def t3_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        dlg = open_auth_modal(page, tab="login")
        dlg.locator('form input[type="email"]').fill("demo@angiadecor.vn")
        dlg.locator('form input[type="password"]').fill("Matkhau123")
        dlg.locator('form button[type="submit"]').click()
        page.wait_for_timeout(200)
        prod = discover_first_product_url(page, cfg.base_url)
        goto_ready(page, f"{cfg.base_url}{prod}")
        page.locator('button[aria-label*="yêu thích" i]').first.click()
        page.wait_for_timeout(150)
        assert page.evaluate("() => Boolean(localStorage.getItem('ag_demo_user') && localStorage.getItem('ag_wishlist'))")
        guard.assert_clean("T3-05")
    finally:
        ctx.close()


@test_case("T3-06", 3, ["F09", "F01"], "1440x900", "Footer validation error token color & valid submission feedback")
def t3_06(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        form = page.locator(".v2-contact-form")
        form.scroll_into_view_if_needed()
        form.locator(".v2-cf-send").click()
        page.wait_for_timeout(150)
        err = form.locator(".v2-cf-error").first
        assert err.is_visible()
        col = err.evaluate("el => getComputedStyle(el).color")
        assert col == "rgb(240, 163, 154)", f"Footer error color={col}"
        form.locator('input[type="text"]').first.fill("Anh Minh")
        form.locator('input[type="email"]').fill("minh@example.com")
        form.locator('input[type="tel"]').fill("0908111222")
        form.locator(".v2-cf-send").click()
        page.wait_for_timeout(200)
        assert "cảm ơn" in page.locator("#footer").inner_text().lower()
        guard.assert_clean("T3-06")
    finally:
        ctx.close()


@test_case("T3-07", 3, ["F15", "F18"], "1440x900", "DreamSpaces hotspot product card -> ProductDetail")
def t3_07(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator("#rooms.v2-dream")
        sec.scroll_into_view_if_needed()
        sec.locator('[role="tab"]').nth(1).click()
        page.wait_for_timeout(800)
        hs = sec.locator(".v2-dream-card .v2-hotspot").first
        hs.scroll_into_view_if_needed()
        hs.hover()
        page.wait_for_timeout(350)
        card = hs.locator(".v2-hotspot-card")
        assert card.is_visible()
        link = card.locator('a[href^="/san-pham/"]').first
        href = link.get_attribute("href")
        assert href
        link.click()
        page.wait_for_url(f"**{href}", timeout=10000)
        assert page.locator(".v2-pd-stage").is_visible()
        guard.assert_clean("T3-07")
    finally:
        ctx.close()


@test_case("T3-08", 3, ["F02", "F19"], "1440x900", "RevealObserver across client-side navigation into /bo-suu-tap")
def t3_08(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator('header a[href="/bo-suu-tap"]').first.click()
        page.wait_for_url("**/bo-suu-tap", timeout=10000)
        scroll_and_reveal(page, step_px=500, pause_ms=100)
        cards = page.locator(".v2-bst-card.is-shown")
        assert cards.count() >= 4
        guard.assert_clean("T3-08")
    finally:
        ctx.close()


@test_case("T3-09", 3, ["F04", "F17"], "390x844", "Mobile drawer -> /danh-muc/tat-ca -> catalog mobile filter drawer")
def t3_09(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator(".v2-burger, header button[aria-label*='menu' i]").first.click()
        drawer = page.locator(".v2-mobile-menu")
        drawer.wait_for(state="visible", timeout=4000)
        drawer.locator("button", has_text="Sản phẩm").first.click()
        drawer.locator('a[href="/danh-muc/tat-ca"]').first.click()
        page.wait_for_url("**/danh-muc/tat-ca", timeout=10000)
        page.evaluate("window.scrollTo(0, 500)")
        page.wait_for_timeout(200)
        page.locator(".v2-cat-tab, button", has_text="Bộ lọc").first.click()
        page.locator(".v2-cat-drawer").wait_for(state="visible", timeout=4000)
        assert_no_horizontal_overflow(page, "T3-09")
        guard.assert_clean("T3-09")
    finally:
        ctx.close()


@test_case("T3-10", 3, ["F08", "F18"], "1440x900", "FloatingActions + Back-to-top + sticky crumbs on ProductDetail")
def t3_10(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        prod = discover_first_product_url(page, cfg.base_url)
        goto_ready(page, f"{cfg.base_url}{prod}")
        page.evaluate("window.scrollTo(0, 620)")
        page.wait_for_timeout(250)
        b_top = page.locator(".v2-pd-top").bounding_box()
        b_fab = page.locator(".ny-contact-trigger").bounding_box()
        b_crm = page.locator(".v2-pd-crumbs.is-pinned").bounding_box()
        assert b_top and b_fab and b_crm
        assert b_top["y"] + b_top["height"] < b_fab["y"]
        assert b_crm["y"] + b_crm["height"] < b_top["y"]
        guard.assert_clean("T3-10")
    finally:
        ctx.close()


@test_case("T3-11", 3, ["F03", "F02"], "1440x900", "Fresh PreloaderSplash completion -> Hero .v2-split/.v2-reveal visible")
def t3_11(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900", skip_splash=False)
    try:
        page.goto(f"{cfg.base_url}/", wait_until="domcontentloaded", timeout=20000)
        wait_for_splash_clear(page, timeout_ms=5500)
        op = page.locator(".v2-hero h1, .v2-hero-cover h1").first.evaluate("el => parseFloat(getComputedStyle(el).opacity)")
        assert op >= 0.95
        guard.assert_clean("T3-11")
    finally:
        ctx.close()


@test_case("T3-12", 3, ["F11", "F18"], "1440x900", "VideoReelsCarousel dialog -> linked ProductDetail")
def t3_12(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        card = page.locator(".v2-tiktok-card").first
        card.scroll_into_view_if_needed()
        card.click()
        dlg = page.locator('[role="dialog"]').first
        dlg.wait_for(state="visible", timeout=4000)
        cta = dlg.locator('a[href^="/san-pham/"], a[href^="/danh-muc/"]').first
        href = cta.get_attribute("href")
        cta.click()
        page.wait_for_url(f"**{href}", timeout=10000)
        guard.assert_clean("T3-12")
    finally:
        ctx.close()


@test_case("T3-13", 3, ["F12", "F19"], "1440x900", "FeaturedSplit tile CTA -> Collection / Category route")
def t3_13(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        tile = page.locator(".v2-featured-tile").first
        tile.scroll_into_view_if_needed()
        link = tile if tile.get_attribute("href") else tile.locator("a[href]").first
        href = link.get_attribute("href")
        assert href
        link.click()
        page.wait_for_url(f"**{href}", timeout=10000)
        assert_all_images_loaded(page, "T3-13")
        guard.assert_clean("T3-13")
    finally:
        ctx.close()


@test_case("T3-14", 3, ["F13", "F14"], "1440x900", "ServicesSwitcher -> Spotlight Side/Overlay -> Commitment alternating surfaces")
def t3_14(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        svc = page.locator(".v2-services")
        svc.scroll_into_view_if_needed()
        svc.locator(".v2-services-btn").nth(2).click()
        bgs = [
            page.locator(s).first.evaluate("el => getComputedStyle(el).backgroundColor")
            for s in (".v2-services", ".v2-spotlight.is-side", ".v2-spotlight.is-overlay", ".v2-commit")
        ]
        assert bgs == ["rgb(20, 22, 25)", "rgb(41, 45, 52)", "rgb(20, 22, 25)", "rgb(41, 45, 52)"], f"Cadence={bgs}"
        guard.assert_clean("T3-14")
    finally:
        ctx.close()


@test_case("T3-15", 3, ["F16", "F17"], "1440x900", "CategoryExplorer Phòng ăn tab row -> Category Catalog with >=1 product")
def t3_15(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator(".v2-catx")
        sec.scroll_into_view_if_needed()
        sec.locator(".v2-catx-tab", has_text="Phòng ăn").first.click()
        page.wait_for_timeout(120)
        row2 = sec.locator(".v2-catx-row").nth(1)
        row2.hover()
        link = row2.locator("a").first
        href = link.get_attribute("href")
        assert href
        link.click()
        page.wait_for_url(f"**{href}", timeout=10000)
        assert page.locator('.v2-cat-grid a[href^="/san-pham/"]').count() >= 1
        guard.assert_clean("T3-15")
    finally:
        ctx.close()


@test_case("T3-16", 3, ["F16", "F20"], "1440x900", "HomeProjectsMarquee -> /du-an -> /du-an/loai/nha-pho custom dropdown")
def t3_16(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator(".v2-hprj")
        sec.scroll_into_view_if_needed()
        sec.locator('a[href="/du-an"]').first.click()
        page.wait_for_url("**/du-an", timeout=10000)
        page.locator(".v2-prj-kinds a, .v2-prj-kinds button", has_text="Nhà phố").first.click()
        page.wait_for_url("**/du-an/loai/nha-pho", timeout=10000)
        assert page.locator("select").count() == 0
        assert page.locator(".v2-prj-year-button").is_visible()
        guard.assert_clean("T3-16")
    finally:
        ctx.close()


@test_case("T3-17", 3, ["F16", "F21"], "1440x900", "HomeLibrarySection -> Library detail -> /thu-vien 3-col grid")
def t3_17(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator(".v2-hlib")
        sec.scroll_into_view_if_needed()
        sec.locator('.v2-hlib-card[href^="/thu-vien/"]').first.click()
        page.wait_for_url("**/thu-vien/**", timeout=10000)
        assert page.locator(".v2-art").is_visible()
        goto_ready(page, f"{cfg.base_url}/thu-vien")
        assert page.locator(".v2-lib-hero").is_visible() and page.locator(".v2-lib-grid").is_visible()
        guard.assert_clean("T3-17")
    finally:
        ctx.close()


@test_case("T3-18", 3, ["F16", "F22"], "1440x900", "HomeNewsSection -> /tin-tuc -> filter Sự kiện -> detail .v2-art")
def t3_18(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator(".v2-hnews")
        sec.scroll_into_view_if_needed()
        sec.locator('a[href="/tin-tuc"]').first.click()
        page.wait_for_url("**/tin-tuc", timeout=10000)
        page.locator(".v2-news-tabs button", has_text="Sự kiện").first.click()
        page.wait_for_timeout(120)
        page.locator('a[href^="/tin-tuc/"]').first.click()
        page.wait_for_url("**/tin-tuc/**", timeout=10000)
        assert page.locator(".v2-art").is_visible()
        guard.assert_clean("T3-18")
    finally:
        ctx.close()


@test_case("T3-19", 3, ["F04", "F15"], "1440x900", "Header Phòng & Liên hệ anchor links scroll to #rooms and #footer")
def t3_19(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator('header a[href="/#rooms"]').first.click()
        page.wait_for_timeout(700)
        assert abs(page.locator("#rooms").bounding_box()["y"]) < 500
        page.locator('header a[href="/#footer"]').first.click()
        page.wait_for_timeout(700)
        assert abs(page.locator("#footer").bounding_box()["y"]) < 600
        guard.assert_clean("T3-19")
    finally:
        ctx.close()


@test_case("T3-20", 3, ["F10", "F11", "F14"], "1440x900", "All Home video ready-slots use local posters & 0 media errors")
def t3_20(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        verify_video_ready_slot(page, page.locator(".v2-tiktok-card").first, 9 / 16, tolerance=0.22)
        verify_video_ready_slot(page, page.locator(".v2-spotlight.is-side .v2-spotlight-picture").first, 16 / 9, tolerance=0.22)
        verify_video_ready_slot(page, page.locator(".v2-spotlight.is-overlay .v2-spotlight-picture").first, 18 / 9, tolerance=0.22)
        verify_video_ready_slot(page, page.locator(".v2-commit-stage").first, 21 / 9, tolerance=0.22)
        guard.assert_clean("T3-20")
    finally:
        ctx.close()


@test_case("T3-21", 3, ["F20", "F04"], "390x844", "Mobile Header + Projects horizontal tabs + custom year dropdown")
def t3_21(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/du-an/loai/nha-pho")
        assert page.locator("select").count() == 0
        page.locator(".v2-prj-year-button").first.click()
        page.locator(".v2-prj-year-menu").wait_for(state="visible", timeout=3000)
        assert_no_horizontal_overflow(page, "T3-21")
        guard.assert_clean("T3-21")
    finally:
        ctx.close()


@test_case("T3-22", 3, ["F21", "F22"], "1440x900", "Shared .v2-art editorial reader geometry matches across Library and News")
def t3_22(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        lib_url = discover_article_url(page, cfg.base_url)
        goto_ready(page, f"{cfg.base_url}{lib_url}")
        w1 = page.locator(".v2-art-body").bounding_box()["width"]
        news_url = discover_news_url(page, cfg.base_url)
        goto_ready(page, f"{cfg.base_url}{news_url}")
        w2 = page.locator(".v2-art-body").bounding_box()["width"]
        assert abs(w1 - w2) <= 4 and abs(w1 - 994) <= 12
        guard.assert_clean("T3-22")
    finally:
        ctx.close()


@test_case("T3-23", 3, ["F08", "F09"], "390x844", "Mobile FloatingActions does not block Footer submit button or channel links")
def t3_23(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator(".v2-cf-send").scroll_into_view_if_needed()
        page.locator(".v2-cf-send").click()
        page.wait_for_timeout(150)
        assert_no_horizontal_overflow(page, "T3-23")
        guard.assert_clean("T3-23")
    finally:
        ctx.close()


@test_case("T3-24", 3, ["F01", "F07", "F09"], "1440x900", "Client-side validation consistency across AuthModal and SiteFooter")
def t3_24(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    dialogs = []
    page.on("dialog", lambda d: (dialogs.append(d.message), d.dismiss()))
    try:
        goto_ready(page, f"{cfg.base_url}/")
        dlg = open_auth_modal(page, tab="login")
        dlg.locator('form button[type="submit"]').click()
        page.wait_for_timeout(120)
        assert page.locator(".auth-dialog .auth-error, .auth-dialog [aria-invalid='true']").count() >= 1
        page.keyboard.press("Escape")
        page.locator(".v2-contact-form").scroll_into_view_if_needed()
        page.locator(".v2-cf-send").click()
        page.wait_for_timeout(120)
        assert page.locator(".v2-contact-form .v2-cf-error, .v2-contact-form [aria-invalid='true']").count() >= 1
        assert not dialogs
        guard.assert_clean("T3-24")
    finally:
        ctx.close()
