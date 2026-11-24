import sys

sys.dont_write_bytecode = True

from playwright.sync_api import Browser

from helpers import (
    RunConfig,
    assert_all_images_loaded,
    assert_channel_links_complete,
    assert_no_horizontal_overflow,
    discover_article_url,
    discover_category_urls,
    discover_first_product_url,
    discover_news_url,
    extract_parity_snapshot,
    goto_ready,
    open_auth_modal,
    open_page,
    probe_live_reference,
    scroll_and_reveal,
    test_case,
    verify_video_ready_slot,
    wait_for_splash_clear,
)


# ==============================================================================
# Part A: 12 End-to-End Customer Journeys (T4-01 .. T4-12)
# ==============================================================================


@test_case("T4-01", 4, ["F01", "F02", "F03", "F11", "F13"], "1440x900", "Journey 1: First-Time Visitor Discovery on /")
def t4_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900", skip_splash=False)
    try:
        page.goto(f"{cfg.base_url}/", wait_until="domcontentloaded", timeout=20000)
        wait_for_splash_clear(page, timeout_ms=6000)
        assert page.evaluate("() => sessionStorage.getItem('ag_splash_done')") == "1"
        page.locator(".v2-hero-dot").nth(1).click()
        page.locator(".v2-hero-dot").nth(2).click()
        reel = page.locator(".v2-tiktok-card").first
        reel.scroll_into_view_if_needed()
        reel.click()
        dlg = page.locator('[role="dialog"]').first
        dlg.wait_for(state="visible", timeout=4000)
        page.keyboard.press("Escape")
        svc = page.locator(".v2-services")
        svc.scroll_into_view_if_needed()
        for i in range(5):
            svc.locator(".v2-services-btn").nth(i).click()
        scroll_and_reveal(page, step_px=650, pause_ms=80)
        assert_all_images_loaded(page, "T4-01")
        assert_no_horizontal_overflow(page, "T4-01")
        guard.assert_clean("T4-01")
    finally:
        ctx.close()


@test_case("T4-02", 4, ["F04", "F08", "F15", "F18"], "1440x900", "Journey 2: Room Inspiration -> Hotspot -> Product Inquiry")
def t4_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator('header a[href="/#rooms"]').first.click()
        page.wait_for_timeout(800)
        sec = page.locator("#rooms.v2-dream")
        sec.locator('[role="tab"]').nth(2).click()
        page.wait_for_timeout(320)
        hs = sec.locator(".v2-dream-card .v2-hotspot").first
        hs.hover()
        page.wait_for_timeout(350)
        link = hs.locator('.v2-hotspot-card a[href^="/san-pham/"]').first
        href = link.get_attribute("href")
        link.click()
        page.wait_for_url(f"**{href}", timeout=10000)
        page.locator(".v2-pd-stage button[aria-label*='Phóng to' i], .v2-pd-stage button[aria-label*='Zoom' i]").first.click()
        page.locator(".v2-pd-lightbox").wait_for(state="visible", timeout=4000)
        page.keyboard.press("Escape")
        page.evaluate("window.scrollTo(0, 620)")
        page.wait_for_timeout(250)
        top_down = page.evaluate("() => document.querySelector('.v2-pd-crumbs.is-pinned')?.getBoundingClientRect().top")
        assert top_down is not None and abs(top_down - 60) <= 3
        page.evaluate("window.scrollBy(0, -120)")
        page.wait_for_timeout(250)
        top_up = page.evaluate("() => document.querySelector('.v2-pd-crumbs.is-pinned')?.getBoundingClientRect().top")
        assert top_up is not None and abs(top_up - 100) <= 3
        page.locator(".ny-contact-trigger").click()
        assert_channel_links_complete(page, ".ny-contact-launcher", cfg.brand, require_svg=True)
        assert_channel_links_complete(page, ".v2-pd-contact", cfg.brand, require_svg=True)
        guard.assert_clean("T4-02")
    finally:
        ctx.close()


@test_case("T4-03", 4, ["F05", "F17", "F18"], "1440x900", "Journey 3: MegaMenu Catalog Filtering -> Product Shortlisting")
def t4_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator("header button", has_text="Sản phẩm").first.click()
        page.locator(".v2-mega").wait_for(state="visible", timeout=4000)
        rooms = page.locator(".v2-mega-rooms li button")
        assert rooms.count() >= 5
        rooms.nth(1).click()
        page.locator('.v2-mega-items a[href^="/danh-muc/"]').first.click()
        page.wait_for_url("**/danh-muc/**", timeout=10000)
        goto_ready(page, f"{cfg.base_url}/danh-muc/tat-ca")
        search_inp = page.locator(".v2-cat-search, .v2-cat-filter-box input[type='text'], .v2-cat-filter-box input[type='search']").first
        search_inp.fill("Sofa")
        page.wait_for_timeout(120)
        page.locator('.v2-cat-reset, button:has-text("Xoá bộ lọc"), button:has-text("Xóa bộ lọc")').first.click()
        page.wait_for_timeout(120)
        page.locator('.v2-cat-grid a[href^="/san-pham/"]').first.click()
        page.wait_for_url("**/san-pham/**", timeout=10000)
        page.locator('button[aria-label*="yêu thích" i]').first.click()
        page.wait_for_timeout(150)
        assert page.evaluate("() => Boolean(localStorage.getItem('ag_wishlist'))")
        guard.assert_clean("T4-03")
    finally:
        ctx.close()


@test_case("T4-04", 4, ["F06", "F07", "F09", "F18"], "1440x900", "Journey 4: Unaccented Vietnamese Search -> Auth -> Footer Consultation")
def t4_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator('.v2-header button[aria-label*="Tìm kiếm" i]:visible').first.click()
        page.locator(".v2-search input").first.fill("sofa bac au")
        page.wait_for_timeout(150)
        res = page.locator('.v2-search a[href^="/san-pham/"]').first
        href = res.get_attribute("href")
        res.click()
        page.wait_for_url(f"**{href}", timeout=10000)
        dlg = open_auth_modal(page, tab="register")
        dlg.locator('form input[type="text"]').first.fill("Nguyễn Minh Anh")
        dlg.locator('form input[type="email"]').first.fill("minhanh@angiadecor.vn")
        tel = dlg.locator('form input[type="tel"]')
        if tel.count() > 0:
            tel.first.fill("0908111222")
        pwds = dlg.locator('form input[type="password"]')
        for i in range(pwds.count()):
            pwds.nth(i).fill("Matkhau123")
        dlg.locator('form button[type="submit"]').click()
        page.wait_for_timeout(150)
        if dlg.is_visible():
            page.keyboard.press("Escape")
        form = page.locator(".v2-contact-form")
        form.scroll_into_view_if_needed()
        form.locator(".v2-cf-send").click()
        page.wait_for_timeout(120)
        assert form.locator(".v2-cf-error, [aria-invalid='true']").count() >= 1
        form.locator('input[type="text"]').first.fill("Nguyễn Minh Anh")
        form.locator('input[type="email"]').fill("minhanh@angiadecor.vn")
        form.locator('input[type="tel"]').fill("0908111222")
        form.locator(".v2-cf-send").click()
        page.wait_for_timeout(200)
        assert "cảm ơn" in page.locator("#footer").inner_text().lower()
        guard.assert_clean("T4-04")
    finally:
        ctx.close()


@test_case("T4-05", 4, ["F02", "F19", "F21", "F22"], "1440x900", "Journey 5: Collections & Editorial Deep-Dive")
def t4_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/bo-suu-tap")
        scroll_and_reveal(page, step_px=500, pause_ms=90)
        assert page.locator(".v2-bst-card.is-shown").count() >= 4
        goto_ready(page, f"{cfg.base_url}/thu-vien")
        page.locator('.v2-lib-hero a[href^="/thu-vien/"]').first.click()
        page.wait_for_url("**/thu-vien/**", timeout=10000)
        assert page.locator(".v2-art").is_visible()
        goto_ready(page, f"{cfg.base_url}/tin-tuc")
        page.locator(".v2-news-tabs button").nth(1).click()
        page.wait_for_timeout(120)
        page.locator('a[href^="/tin-tuc/"]').first.click()
        page.wait_for_url("**/tin-tuc/**", timeout=10000)
        assert page.locator(".v2-art").is_visible()
        guard.assert_clean("T4-05")
    finally:
        ctx.close()


@test_case("T4-06", 4, ["F16", "F20"], "1440x900", "Journey 6: Architecture Project Research (/du-an -> /du-an/loai/nha-pho)")
def t4_06(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator('.v2-hprj a[href="/du-an"]').first.click()
        page.wait_for_url("**/du-an", timeout=10000)
        assert page.locator(".v2-prjo-group").count() >= 2
        page.locator(".v2-prj-kinds a, .v2-prj-kinds button", has_text="Nhà phố").first.click()
        page.wait_for_url("**/du-an/loai/nha-pho", timeout=10000)
        assert page.locator("select").count() == 0
        page.locator(".v2-prj-year-button").first.click()
        page.locator(".v2-prj-year-menu button, .v2-prj-year-menu [role='option']", has_text="2025").first.click()
        page.wait_for_timeout(150)
        assert page.locator(".v2-prj-grid > *").count() >= 1
        guard.assert_clean("T4-06")
    finally:
        ctx.close()


@test_case("T4-07", 4, ["F04", "F08", "F11", "F13", "F15", "F16"], "390x844", "Journey 7: Mobile Shopper Discovery on /")
def t4_07(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        assert abs(page.locator(".v2-header-bar").bounding_box()["height"] - 64) <= 2
        burger = page.locator(".v2-burger, header button[aria-label*='menu' i]").first
        burger.click()
        drawer = page.locator(".v2-mobile-menu")
        drawer.wait_for(state="visible", timeout=4000)
        drawer.locator("button", has_text="Sản phẩm").first.click()
        burger.click()
        page.wait_for_timeout(150)
        page.locator(".v2-services-m .v2-services-m-item").first.scroll_into_view_if_needed()
        page.locator(".v2-services-m .v2-services-m-item button").nth(1).click()
        page.locator(".v2-catx").scroll_into_view_if_needed()
        page.locator(".ny-contact-trigger").click()
        assert page.locator(".ny-contact-label").count() == 4
        assert_no_horizontal_overflow(page, "T4-07")
        guard.assert_clean("T4-07")
    finally:
        ctx.close()


@test_case("T4-08", 4, ["F04", "F08", "F17", "F18"], "390x844", "Journey 8: Mobile Catalog Drawer -> Product Detail -> Channel CTAs")
def t4_08(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/danh-muc/tat-ca")
        page.evaluate("window.scrollTo(0, 500)")
        page.wait_for_timeout(200)
        page.locator(".v2-cat-tab, button", has_text="Bộ lọc").first.click()
        page.locator(".v2-cat-drawer").wait_for(state="visible", timeout=4000)
        page.locator(".v2-cat-drawer button[aria-label*='Đóng' i]").first.click()
        page.locator('.v2-cat-grid a[href^="/san-pham/"]').first.click()
        page.wait_for_url("**/san-pham/**", timeout=10000)
        page.evaluate("window.scrollTo(0, 500)")
        page.wait_for_timeout(200)
        assert_channel_links_complete(page, ".v2-pd-contact", cfg.brand, require_svg=True)
        assert_no_horizontal_overflow(page, "T4-08")
        guard.assert_clean("T4-08")
    finally:
        ctx.close()


@test_case("T4-09", 4, ["F19", "F20", "F21", "F22"], "390x844", "Journey 9: Mobile Editorial & Portfolio Reading")
def t4_09(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        art_url = discover_article_url(page, cfg.base_url)
        news_url = discover_news_url(page, cfg.base_url)
        for route in ["/bo-suu-tap", "/du-an/loai/nha-pho", "/thu-vien", art_url, "/tin-tuc", news_url]:
            goto_ready(page, f"{cfg.base_url}{route}")
            scroll_and_reveal(page, step_px=600, pause_ms=60)
            assert_all_images_loaded(page, f"T4-09:{route}")
            assert_no_horizontal_overflow(page, f"T4-09:{route}")
        guard.assert_clean("T4-09")
    finally:
        ctx.close()


@test_case("T4-10", 4, ["F08", "F10", "F11", "F14"], "1440x900", "Journey 10: Brand Independence & Asset Readiness Audit")
def t4_10(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        prod_url = discover_first_product_url(page, cfg.base_url)
        for route in ["/", "/danh-muc/tat-ca", prod_url, "/bo-suu-tap", "/du-an", "/thu-vien", "/tin-tuc"]:
            goto_ready(page, f"{cfg.base_url}{route}")
            txt = page.locator("body").inner_text().lower()
            assert "nhuydecor" not in txt and "nhuy decor" not in txt
            assert_all_images_loaded(page, f"T4-10:{route}")
        goto_ready(page, f"{cfg.base_url}/")
        verify_video_ready_slot(page, page.locator(".v2-tiktok-card").first, 9 / 16, tolerance=0.22)
        verify_video_ready_slot(page, page.locator(".v2-spotlight.is-side .v2-spotlight-picture").first, 16 / 9, tolerance=0.22)
        verify_video_ready_slot(page, page.locator(".v2-spotlight.is-overlay .v2-spotlight-picture").first, 18 / 9, tolerance=0.22)
        verify_video_ready_slot(page, page.locator(".v2-commit-stage").first, 21 / 9, tolerance=0.22)
        guard.assert_clean("T4-10")
    finally:
        ctx.close()


@test_case("T4-11", 4, ["F01", "F02", "F03", "F05", "F07", "F09", "F19"], "1440x900", "Journey 11: Accessibility & Reduced Motion Journey")
def t4_11(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900", skip_splash=False, reduced_motion=True)
    try:
        page.goto(f"{cfg.base_url}/", wait_until="domcontentloaded", timeout=20000)
        wait_for_splash_clear(page, timeout_ms=800)
        stuck_home = page.evaluate(
            """() => Array.from(document.querySelectorAll('.v2-reveal, [data-reveal], .v2-split, .v2-hotspots'))
                .filter(el => getComputedStyle(el).display !== 'none' && parseFloat(getComputedStyle(el).opacity) < 0.9).length"""
        )
        assert stuck_home == 0
        goto_ready(page, f"{cfg.base_url}/bo-suu-tap")
        stuck_bst = page.evaluate(
            "() => Array.from(document.querySelectorAll('.v2-bst-card')).filter(e => parseFloat(getComputedStyle(e).opacity) < 0.9).length"
        )
        assert stuck_bst == 0
        guard.assert_clean("T4-11")
    finally:
        ctx.close()


@test_case("T4-12", 4, ["F01", "F04", "F10", "F17", "F18", "F19", "F20", "F21", "F22"], "1440x900", "Journey 12: Full Multi-Route Health & Zero-Error Sweep (Desktop & Mobile)")
def t4_12(browser: Browser, cfg: RunConfig) -> None:
    for vp in ("1440x900", "390x844"):
        ctx, page, guard = open_page(browser, cfg.base_url, vp)
        try:
            prod = discover_first_product_url(page, cfg.base_url)
            art = discover_article_url(page, cfg.base_url)
            news = discover_news_url(page, cfg.base_url)
            routes = [
                "/",
                "/danh-muc/tat-ca",
                "/danh-muc/sofa-bac-au",
                prod,
                "/bo-suu-tap",
                "/du-an",
                "/du-an/loai/nha-pho",
                "/du-an/loai/van-phong",
                "/du-an/loai/cua-hang",
                "/thu-vien",
                art,
                "/tin-tuc",
                news,
            ]
            for r in routes:
                goto_ready(page, f"{cfg.base_url}{r}")
                scroll_and_reveal(page, step_px=750, pause_ms=50)
                assert_all_images_loaded(page, f"T4-12:{vp}:{r}")
                assert_no_horizontal_overflow(page, f"T4-12:{vp}:{r}")
            guard.assert_clean(f"T4-12:{vp}")
        finally:
            ctx.close()


# ==============================================================================
# Part B: Automated Computed-CSS, Section-Geometry & Screenshot Parity Suites
# ==============================================================================


@test_case("T4-PARITY-CHROME", 4, ["F01", "F04", "F08", "F09"], "1440x900", "Computed CSS & Token Parity for Global Chrome (Desktop & Mobile)")
def t4_parity_chrome(browser: Browser, cfg: RunConfig) -> None:
    base = cfg.baseline
    tok = base["tokens"]
    chr_spec = base["chrome"]

    # Desktop 1440x900
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        snap = extract_parity_snapshot(page, mode="chrome")
        assert tok["fontFamilySubstr"].lower() in snap["fontFamily"].lower()
        assert abs(snap["wrapWidth"] - tok["containerMaxWidthPx"]) <= 6
        assert abs(snap["headerTopHeight"] - chr_spec["header"]["desktopTopHeight"]) <= 2
        assert abs(snap["headerBarHeight"] - chr_spec["header"]["desktopBarHeight"]) <= 2
        assert snap["footerFormBg"] == chr_spec["footer"]["formBg"]
        assert snap["footerMainBg"] == chr_spec["footer"]["mainBg"]
        assert abs(snap["fabTriggerSize"]["w"] - chr_spec["floatingActions"]["triggerSizeDesktop"]) <= 2
        # Scroll past 450px so .v2-pd-top.is-shown transitions from scale(0) before measuring backToTopSize
        page.evaluate("window.scrollTo(0, 480)")
        page.wait_for_timeout(250)
        snap_scrolled = extract_parity_snapshot(page, mode="chrome")
        assert abs(snap_scrolled["backToTopSize"]["w"] - chr_spec["floatingActions"]["backToTopSize"]) <= 2
        assert abs(snap_scrolled["backToTopSize"]["h"] - chr_spec["floatingActions"]["backToTopSize"]) <= 2
        assert_no_horizontal_overflow(page, "T4-PARITY-CHROME-desktop")
        guard.assert_clean("T4-PARITY-CHROME-desktop")
    finally:
        ctx.close()

    # Mobile 390x844
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        snap_m = extract_parity_snapshot(page, mode="chrome")
        assert snap_m["headerTopDisplay"] == "none"
        assert abs(snap_m["headerBarHeight"] - chr_spec["header"]["mobileBarHeight"]) <= 2
        assert abs(snap_m["fabTriggerSize"]["w"] - chr_spec["floatingActions"]["triggerSizeMobile"]) <= 2
        assert_no_horizontal_overflow(page, "T4-PARITY-CHROME-mobile")
        guard.assert_clean("T4-PARITY-CHROME-mobile")
    finally:
        ctx.close()


@test_case("T4-PARITY-HOME", 4, ["F11", "F12", "F13", "F14", "F15", "F16"], "1440x900", "All 15 Homepage Sections Cadence, Surfaces & Geometry Parity")
def t4_parity_home(browser: Browser, cfg: RunConfig) -> None:
    expected = cfg.baseline["homeSections"]
    for vp, bg_key, h_key in [
        ("1440x900", "bgDesktop", "heightDesktop"),
        ("390x844", "bgMobile", "heightMobile"),
    ]:
        ctx, page, guard = open_page(browser, cfg.base_url, vp)
        try:
            goto_ready(page, f"{cfg.base_url}/")
            scroll_and_reveal(page, step_px=700, pause_ms=60)
            snap = extract_parity_snapshot(page, mode="home")
            assert snap["sectionCount"] == 15, f"[{vp}] Expected 15 home sections, got {snap['sectionCount']}"
            for idx, exp in enumerate(expected):
                actual = snap["sections"][idx]
                assert actual["bg"] == exp[bg_key], (
                    f"[{vp}] Section {idx + 1} ({exp['name']}) bg mismatch: {actual['bg']} != {exp[bg_key]}"
                )
                exp_h = exp[h_key]
                tol_px = max(cfg.baseline["meta"].get("heightTolerancePx", 24), round(exp_h * 0.12))
                assert abs(actual["height"] - exp_h) <= tol_px, (
                    f"[{vp}] Section {idx + 1} ({exp['name']}) height out of parity range: "
                    f"{actual['height']} vs {exp_h}±{tol_px}px"
                )
            assert_no_horizontal_overflow(page, f"T4-PARITY-HOME-{vp}")
            guard.assert_clean(f"T4-PARITY-HOME-{vp}")
        finally:
            ctx.close()


@test_case("T4-PARITY-INNER", 4, ["F17", "F18", "F19", "F20", "F21", "F22"], "1440x900", "All 6 Inner Page Templates Layout & CSS Parity (Desktop & Mobile)")
def t4_parity_inner(browser: Browser, cfg: RunConfig) -> None:
    ip = cfg.baseline["innerPages"]

    # Desktop 1440x900
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        # Catalog
        goto_ready(page, f"{cfg.base_url}{ip['catalog']['route']}")
        assert page.locator(".v2-cat-aside .v2-cat-filter-box").evaluate("e => getComputedStyle(e).backgroundColor") == ip["catalog"]["filterBoxBg"]
        assert page.locator(".v2-cat-grid").evaluate("e => getComputedStyle(e).gridTemplateColumns.split(' ').length") == ip["catalog"]["gridColsDesktop"]

        # Product detail
        prod = discover_first_product_url(page, cfg.base_url)
        goto_ready(page, f"{cfg.base_url}{prod}")
        assert abs(page.locator(".v2-pd-banner").bounding_box()["height"] - ip["productDetail"]["bannerHeightDesktop"]) <= 12
        assert_channel_links_complete(page, ".v2-pd-contact", cfg.brand, require_svg=True)

        # Collection
        goto_ready(page, f"{cfg.base_url}{ip['collection']['route']}")
        assert page.locator(".v2-bst-row").first.evaluate("e => getComputedStyle(e).backgroundColor") == ip["collection"]["oddRowBg"]

        # Projects
        goto_ready(page, f"{cfg.base_url}/du-an/loai/nha-pho")
        assert page.locator("select").count() == 0
        assert page.locator(".v2-prj-grid").evaluate("e => getComputedStyle(e).gridTemplateColumns.split(' ').length") == ip["projects"]["gridColsDesktop"]

        # Library + detail
        goto_ready(page, f"{cfg.base_url}/thu-vien")
        assert page.locator(".v2-lib-grid").evaluate("e => getComputedStyle(e).gridTemplateColumns.split(' ').length") == ip["library"]["gridColsDesktop"]
        art = discover_article_url(page, cfg.base_url)
        goto_ready(page, f"{cfg.base_url}{art}")
        assert abs(page.locator(".v2-art-body").bounding_box()["width"] - ip["library"]["detailContainerWidth"]) <= 12

        # News + detail
        goto_ready(page, f"{cfg.base_url}/tin-tuc")
        assert page.locator(".v2-news-tile, .v2-news-hero-tile").count() == ip["news"]["heroTileCount"]
        assert page.locator(".v2-news-row.is-flip").count() >= 1
        news = discover_news_url(page, cfg.base_url)
        goto_ready(page, f"{cfg.base_url}{news}")
        assert abs(page.locator(".v2-art-body").bounding_box()["width"] - ip["news"]["detailContainerWidth"]) <= 12
        assert_no_horizontal_overflow(page, "T4-PARITY-INNER-desktop")
        guard.assert_clean("T4-PARITY-INNER-desktop")
    finally:
        ctx.close()

    # Mobile 390x844
    ctx_m, page_m, guard_m = open_page(browser, cfg.base_url, "390x844")
    try:
        # Catalog mobile
        goto_ready(page_m, f"{cfg.base_url}{ip['catalog']['route']}")
        cat_ban_h = page_m.locator(".v2-cat-banner").bounding_box()["height"]
        assert abs(cat_ban_h - ip["catalog"]["bannerHeightMobile"]) <= 24, (
            f"[390x844] Catalog banner height={cat_ban_h} vs ~{ip['catalog']['bannerHeightMobile']}"
        )
        assert page_m.locator(".v2-cat-grid").evaluate("e => getComputedStyle(e).gridTemplateColumns.split(' ').length") == ip["catalog"]["gridColsMobile"]
        assert_no_horizontal_overflow(page_m, "T4-PARITY-INNER-mobile-catalog")

        # Product detail mobile
        prod_m = discover_first_product_url(page_m, cfg.base_url)
        goto_ready(page_m, f"{cfg.base_url}{prod_m}")
        pd_ban_h = page_m.locator(".v2-pd-banner").bounding_box()["height"]
        assert abs(pd_ban_h - ip["productDetail"]["bannerHeightMobile"]) <= 24, (
            f"[390x844] ProductDetail banner height={pd_ban_h} vs ~{ip['productDetail']['bannerHeightMobile']}"
        )
        assert_no_horizontal_overflow(page_m, "T4-PARITY-INNER-mobile-product")

        # Collection mobile
        goto_ready(page_m, f"{cfg.base_url}{ip['collection']['route']}")
        assert page_m.locator(".v2-bst-row").first.evaluate("e => getComputedStyle(e).gridTemplateColumns.split(' ').length") == ip["collection"]["gridColsMobile"]
        assert_no_horizontal_overflow(page_m, "T4-PARITY-INNER-mobile-collection")

        # Projects mobile
        goto_ready(page_m, f"{cfg.base_url}/du-an/loai/nha-pho")
        prj_ban_h = page_m.locator(".v2-prj-banner, .v2-prj > section").first.bounding_box()["height"]
        assert abs(prj_ban_h - ip["projects"]["bannerHeightMobile"]) <= 24, (
            f"[390x844] Projects banner height={prj_ban_h} vs ~{ip['projects']['bannerHeightMobile']}"
        )
        assert page_m.locator(".v2-prj-grid").evaluate("e => getComputedStyle(e).gridTemplateColumns.split(' ').length") == ip["projects"]["gridColsMobile"]
        assert_no_horizontal_overflow(page_m, "T4-PARITY-INNER-mobile-projects")

        # Library mobile
        goto_ready(page_m, f"{cfg.base_url}/thu-vien")
        assert page_m.locator(".v2-lib-grid").evaluate("e => getComputedStyle(e).gridTemplateColumns.split(' ').length") == ip["library"]["gridColsMobile"]
        assert_no_horizontal_overflow(page_m, "T4-PARITY-INNER-mobile-library")

        # News + detail mobile
        goto_ready(page_m, f"{cfg.base_url}/tin-tuc")
        assert page_m.locator(".v2-news-hero").evaluate("e => getComputedStyle(e).gridTemplateColumns.split(' ').length") == 2
        news_m = discover_news_url(page_m, cfg.base_url)
        goto_ready(page_m, f"{cfg.base_url}{news_m}")
        assert page_m.locator(".v2-art-body").bounding_box()["width"] <= 358
        assert_no_horizontal_overflow(page_m, "T4-PARITY-INNER-mobile-news")
        guard_m.assert_clean("T4-PARITY-INNER-mobile")
    finally:
        ctx_m.close()


@test_case("T4-PARITY-SCREENSHOTS", 4, ["F01", "F11", "F17", "F18", "F19", "F20", "F21", "F22"], "1440x900", "Capture Parity Screenshots & Optional Live nhuydecor.vn Diff")
def t4_parity_screenshots(browser: Browser, cfg: RunConfig) -> None:
    cfg.screenshots_dir.mkdir(parents=True, exist_ok=True)

    # Discover dynamic routes once
    ctx_d, page_d, _ = open_page(browser, cfg.base_url, "1440x900")
    try:
        prod = discover_first_product_url(page_d, cfg.base_url)
        art = discover_article_url(page_d, cfg.base_url)
        news = discover_news_url(page_d, cfg.base_url)
    finally:
        ctx_d.close()

    targets = [
        ("home", "/"),
        ("catalog", "/danh-muc/sofa-bac-au"),
        ("product_detail", prod),
        ("collection", "/bo-suu-tap"),
        ("projects", "/du-an/loai/nha-pho"),
        ("library", "/thu-vien"),
        ("library_detail", art),
        ("news", "/tin-tuc"),
        ("news_detail", news),
    ]

    captured = []
    for vp in ("1440x900", "390x844"):
        ctx, page, guard = open_page(browser, cfg.base_url, vp)
        try:
            for name, route in targets:
                goto_ready(page, f"{cfg.base_url}{route}")
                scroll_and_reveal(page, step_px=700, pause_ms=50)
                page.evaluate("window.scrollTo(0, 0)")
                page.wait_for_timeout(150)
                fold_path = cfg.screenshots_dir / f"{name}_{vp}_fold.png"
                full_path = cfg.screenshots_dir / f"{name}_{vp}_full.png"
                page.screenshot(path=str(fold_path), full_page=False)
                page.screenshot(path=str(full_path), full_page=True)
                captured.extend([str(fold_path), str(full_path)])
                assert fold_path.stat().st_size > 1000
                assert full_path.stat().st_size > 1000
            guard.assert_clean(f"T4-PARITY-SCREENSHOTS-{vp}")
        finally:
            ctx.close()

    cfg.extra_artifacts["screenshots"] = captured

    if cfg.live_ref:
        ref_url = cfg.baseline["meta"]["referenceUrl"]
        live_desktop = probe_live_reference(browser, ref_url, "1440x900", mode="home")
        ctx_l, page_l, _ = open_page(browser, cfg.base_url, "1440x900")
        try:
            goto_ready(page_l, f"{cfg.base_url}/")
            local_home = extract_parity_snapshot(page_l, mode="home")
        finally:
            ctx_l.close()
        diff_summary = {
            "referenceProbeOk": live_desktop.get("ok"),
            "referenceSectionCount": live_desktop.get("snapshot", {}).get("sectionCount") if live_desktop.get("ok") else None,
            "localSectionCount": local_home.get("sectionCount"),
            "referenceError": live_desktop.get("error"),
        }
        if live_desktop.get("ok"):
            ref_secs = live_desktop["snapshot"]["sections"]
            loc_secs = local_home["sections"]
            per_sec = []
            for i in range(min(len(ref_secs), len(loc_secs))):
                per_sec.append(
                    {
                        "index": i + 1,
                        "refBg": ref_secs[i]["bg"],
                        "localBg": loc_secs[i]["bg"],
                        "bgMatch": ref_secs[i]["bg"] == loc_secs[i]["bg"],
                        "refHeight": ref_secs[i]["height"],
                        "localHeight": loc_secs[i]["height"],
                    }
                )
            diff_summary["sections"] = per_sec
        cfg.extra_artifacts["ref_live_diff"] = diff_summary
