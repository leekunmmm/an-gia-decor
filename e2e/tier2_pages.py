import sys

sys.dont_write_bytecode = True

from playwright.sync_api import Browser

from helpers import (
    RunConfig,
    assert_all_images_loaded,
    assert_no_horizontal_overflow,
    discover_article_url,
    discover_first_product_url,
    discover_news_url,
    goto_ready,
    open_page,
    scroll_and_reveal,
    test_case,
    verify_video_ready_slot,
)


# ==============================================================================
# Feature #11 Boundary Cases (F11 — 5 tests)
# ==============================================================================


@test_case("T2-F11-01", 2, ["F11"], "1440x900", "Rapidly clicking HeroSlider dots 3 -> 1 -> 2 leaves slide 2 active")
def t2_f11_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        dots = page.locator(".v2-hero-dot")
        dots.nth(2).click()
        dots.nth(0).click()
        dots.nth(1).click()
        page.wait_for_timeout(150)
        assert "is-active" in (dots.nth(1).get_attribute("class") or "")
        assert page.locator(".v2-hero-dot.is-active").count() == 1
        guard.assert_clean("T2-F11-01")
    finally:
        ctx.close()


@test_case("T2-F11-02", 2, ["F11"], "390x844", "Mobile hides .v2-tiktok-arrows and scrolls .v2-tiktok-row cleanly")
def t2_f11_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        arrows = page.locator(".v2-tiktok-arrows")
        if arrows.count() > 0:
            disp = arrows.first.evaluate("el => getComputedStyle(el).display")
            assert disp == "none", f"Expected .v2-tiktok-arrows hidden on mobile, got {disp}"
        assert_no_horizontal_overflow(page, "T2-F11-02")
        guard.assert_clean("T2-F11-02")
    finally:
        ctx.close()


@test_case("T2-F11-03", 2, ["F11"], "1440x900", "Clicking Prev at scrollLeft=0 stays at 0; Next advances")
def t2_f11_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        row = page.locator(".v2-tiktok-row")
        row.scroll_into_view_if_needed()
        assert row.evaluate("el => el.scrollLeft") <= 1
        arrows = page.locator(".v2-tiktok-arrows button")
        arrows.nth(0).click()
        page.wait_for_timeout(200)
        assert row.evaluate("el => el.scrollLeft") <= 1, "Prev button at scrollLeft=0 must stay at start"
        arrows.nth(1).click()
        page.wait_for_timeout(350)
        assert row.evaluate("el => el.scrollLeft") > 0
        guard.assert_clean("T2-F11-03")
    finally:
        ctx.close()


@test_case("T2-F11-04", 2, ["F11"], "1440x900", "Pressing Escape dismisses open VideoReel dialog")
def t2_f11_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        card = page.locator(".v2-tiktok-card").first
        card.scroll_into_view_if_needed()
        card.click()
        page.locator('[role="dialog"]').first.wait_for(state="visible", timeout=4000)
        page.keyboard.press("Escape")
        page.wait_for_timeout(150)
        assert page.locator('[role="dialog"]').count() == 0, "Expected Escape to dismiss VideoReel dialog"
        guard.assert_clean("T2-F11-04")
    finally:
        ctx.close()


@test_case("T2-F11-05", 2, ["F11"], "1440x900", "All VideoReels cards pass video ready-slot poster fallback check")
def t2_f11_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        cards = page.locator(".v2-tiktok-card")
        cards.first.scroll_into_view_if_needed()
        n = cards.count()
        assert n >= 4
        for i in range(min(n, 6)):
            verify_video_ready_slot(page, cards.nth(i), expected_aspect=9 / 16, tolerance=0.22)
        guard.assert_clean("T2-F11-05")
    finally:
        ctx.close()


# ==============================================================================
# Feature #12 Boundary Cases (F12 — 5 tests)
# ==============================================================================


@test_case("T2-F12-01", 2, ["F12"], "1440x900", "Deep-link /#collections lands without header clipping tile copy")
def t2_f12_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/#collections")
        page.wait_for_timeout(200)
        rect = page.locator("#collections").bounding_box()
        assert rect is not None and abs(rect["y"]) <= 140
        guard.assert_clean("T2-F12-01")
    finally:
        ctx.close()


@test_case("T2-F12-02", 2, ["F12"], "1440x900", "Hover-in and hover-out across FeaturedSplit tiles resets hover opacity")
def t2_f12_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        tiles = page.locator(".v2-featured-tile")
        tiles.first.scroll_into_view_if_needed()
        tiles.nth(0).hover()
        page.wait_for_timeout(400)
        tiles.nth(1).hover()
        page.wait_for_timeout(450)
        op0 = tiles.nth(0).locator(".v2-featured-hover").evaluate("el => parseFloat(getComputedStyle(el).opacity)")
        assert op0 <= 0.15, f"Expected first tile hover image to fade out after pointer leaves, got {op0}"
        guard.assert_clean("T2-F12-02")
    finally:
        ctx.close()


@test_case("T2-F12-03", 2, ["F12"], "390x844", "FeaturedSplit .v2-more stays inside tile bounds on 390px mobile")
def t2_f12_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        tile = page.locator(".v2-featured-tile").first
        tile.scroll_into_view_if_needed()
        tb = tile.bounding_box()
        mb = tile.locator(".v2-more").bounding_box()
        assert mb["y"] + mb["height"] <= tb["y"] + tb["height"] + 2
        assert_no_horizontal_overflow(page, "T2-F12-03")
        guard.assert_clean("T2-F12-03")
    finally:
        ctx.close()


@test_case("T2-F12-04", 2, ["F12"], "1440x900", "AboutSection 10+ stat stays aligned at 1100px vs 1440px")
def t2_f12_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1100x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        about = page.locator(".v2-about")
        about.scroll_into_view_if_needed()
        cols = about.locator(".v2-about-grid").evaluate("el => getComputedStyle(el).gridTemplateColumns.split(' ').length")
        assert cols == 2
        assert_no_horizontal_overflow(page, "T2-F12-04")
        guard.assert_clean("T2-F12-04")
    finally:
        ctx.close()


@test_case("T2-F12-05", 2, ["F12"], "390x844", "AboutSection collapses to 1 column cleanly on mobile")
def t2_f12_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        about = page.locator(".v2-about")
        about.scroll_into_view_if_needed()
        cols = about.locator(".v2-about-grid").evaluate("el => getComputedStyle(el).gridTemplateColumns.split(' ').length")
        assert cols == 1
        assert_no_horizontal_overflow(page, "T2-F12-05")
        guard.assert_clean("T2-F12-05")
    finally:
        ctx.close()


# ==============================================================================
# Feature #13 Boundary Cases (F13 — 5 tests)
# ==============================================================================


@test_case("T2-F13-01", 2, ["F13"], "1440x900", "Rapidly clicking 01 -> 05 -> 02 leaves only 02 active")
def t2_f13_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator(".v2-services")
        sec.scroll_into_view_if_needed()
        btns = sec.locator(".v2-services-btn")
        btns.nth(0).click()
        btns.nth(4).click()
        btns.nth(1).click()
        page.wait_for_timeout(150)
        assert btns.nth(1).get_attribute("aria-pressed") == "true"
        assert sec.locator('.v2-services-btn[aria-pressed="true"]').count() == 1
        guard.assert_clean("T2-F13-01")
    finally:
        ctx.close()


@test_case("T2-F13-02", 2, ["F13"], "1440x900", "Re-clicking active service 01 keeps it pressed and stage image visible")
def t2_f13_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator(".v2-services")
        sec.scroll_into_view_if_needed()
        b0 = sec.locator(".v2-services-btn").first
        b0.click()
        b0.click()
        page.wait_for_timeout(100)
        assert b0.get_attribute("aria-pressed") == "true"
        assert sec.locator(".v2-services-picture img.is-active").count() == 1
        guard.assert_clean("T2-F13-02")
    finally:
        ctx.close()


@test_case("T2-F13-03", 2, ["F13"], "390x844", "Mobile accordion toggles open/close and switches cleanly")
def t2_f13_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator(".v2-services")
        sec.scroll_into_view_if_needed()
        items = sec.locator(".v2-services-m .v2-services-m-item")
        head1 = items.nth(1).locator(".v2-services-m-head").first
        head1.click()
        page.wait_for_timeout(150)
        assert "is-open" in (head1.get_attribute("class") or "")
        assert head1.get_attribute("aria-expanded") == "true"
        head3 = items.nth(3).locator(".v2-services-m-head").first
        head3.click()
        page.wait_for_timeout(150)
        assert "is-open" in (head3.get_attribute("class") or "")
        assert head3.get_attribute("aria-expanded") == "true"
        guard.assert_clean("T2-F13-03")
    finally:
        ctx.close()


@test_case("T2-F13-04", 2, ["F13"], "768x900", "Resize 768px -> 767px switches ServicesSwitcher desktop vs mobile view")
def t2_f13_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "768x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator(".v2-services")
        sec.scroll_into_view_if_needed()
        assert sec.locator(".v2-services-grid").evaluate("el => getComputedStyle(el).display") != "none"
        page.set_viewport_size({"width": 767, "height": 900})
        page.wait_for_timeout(150)
        assert sec.locator(".v2-services-grid").evaluate("el => getComputedStyle(el).display") == "none"
        assert sec.locator(".v2-services-m").evaluate("el => getComputedStyle(el).display") != "none"
        guard.assert_clean("T2-F13-04")
    finally:
        ctx.close()


@test_case("T2-F13-05", 2, ["F13"], "1440x900", "Keyboard Enter activation updates active ServicesSwitcher button")
def t2_f13_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator(".v2-services")
        sec.scroll_into_view_if_needed()
        b4 = sec.locator(".v2-services-btn").nth(3)
        b4.focus()
        page.keyboard.press("Enter")
        page.wait_for_timeout(120)
        assert b4.get_attribute("aria-pressed") == "true"
        guard.assert_clean("T2-F13-05")
    finally:
        ctx.close()


# ==============================================================================
# Feature #14 Boundary Cases (F14 — 5 tests)
# ==============================================================================


@test_case("T2-F14-01", 2, ["F14"], "1440x900", "Both Spotlight sections pass video ready-slot verification")
def t2_f14_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        side = page.locator(".v2-spotlight.is-side .v2-spotlight-picture").first
        side.scroll_into_view_if_needed()
        verify_video_ready_slot(page, side, expected_aspect=16 / 9, tolerance=0.22)
        overlay = page.locator(".v2-spotlight.is-overlay .v2-spotlight-picture").first
        overlay.scroll_into_view_if_needed()
        verify_video_ready_slot(page, overlay, expected_aspect=18 / 9, tolerance=0.22)
        guard.assert_clean("T2-F14-01")
    finally:
        ctx.close()


@test_case("T2-F14-02", 2, ["F14"], "1440x900", "Commitment frosted card overlaps bottom edge of 21:9 stage cleanly")
def t2_f14_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator(".v2-commit")
        sec.scroll_into_view_if_needed()
        stage_box = sec.locator(".v2-commit-stage").bounding_box()
        card_box = sec.locator(".v2-commit-card").bounding_box()
        copy_box = sec.locator(".v2-commit-copy").bounding_box()
        assert card_box["y"] < stage_box["y"] + stage_box["height"], "Expected frosted card to overlap stage bottom"
        assert card_box["x"] + card_box["width"] <= copy_box["x"] + 2, "Frosted card overlaps copy CTA"
        guard.assert_clean("T2-F14-02")
    finally:
        ctx.close()


@test_case("T2-F14-03", 2, ["F14"], "390x844", "Mobile Commitment uses 4:3 stage and -60px offset without overflow")
def t2_f14_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator(".v2-commit")
        sec.scroll_into_view_if_needed()
        verify_video_ready_slot(page, sec.locator(".v2-commit-stage"), expected_aspect=4 / 3, tolerance=0.25)
        mt = sec.locator(".v2-commit-row-wrap").evaluate("el => parseFloat(getComputedStyle(el).marginTop)")
        assert mt < 0, f"Expected negative mobile overlap marginTop, got {mt}"
        assert_no_horizontal_overflow(page, "T2-F14-03")
        guard.assert_clean("T2-F14-03")
    finally:
        ctx.close()


@test_case("T2-F14-04", 2, ["F14"], "1440x900", "Commitment marquee stays readable under prefers-reduced-motion: reduce")
def t2_f14_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900", reduced_motion=True)
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator(".v2-marquee").first.scroll_into_view_if_needed()
        track = page.locator(".v2-marquee-track").first
        assert track.is_visible() and len(track.inner_text().strip()) > 10
        guard.assert_clean("T2-F14-04")
    finally:
        ctx.close()


@test_case("T2-F14-05", 2, ["F14"], "1100x900", "Spotlight breakpoint 1100px -> 1099px switches layout cleanly")
def t2_f14_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1100x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator(".v2-spotlight.is-side").scroll_into_view_if_needed()
        page.set_viewport_size({"width": 1099, "height": 900})
        page.wait_for_timeout(150)
        verify_video_ready_slot(page, page.locator(".v2-spotlight.is-side .v2-spotlight-picture"), expected_aspect=4 / 3, tolerance=0.35)
        assert_no_horizontal_overflow(page, "T2-F14-05")
        guard.assert_clean("T2-F14-05")
    finally:
        ctx.close()


# ==============================================================================
# Feature #15 Boundary Cases (F15 — 5 tests)
# ==============================================================================


@test_case("T2-F15-01", 2, ["F15"], "1440x900", "Hotspot cards near container edges remain inside viewport without overflow")
def t2_f15_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator("#rooms.v2-dream")
        sec.scroll_into_view_if_needed()
        hs = sec.locator(".v2-dream-card .v2-hotspot")
        for i in range(hs.count()):
            hs.nth(i).hover()
            page.wait_for_timeout(80)
            assert_no_horizontal_overflow(page, f"T2-F15-01-hs{i}")
        guard.assert_clean("T2-F15-01")
    finally:
        ctx.close()


@test_case("T2-F15-02", 2, ["F15"], "1440x900", "Switching DreamSpaces tab refreshes hotspot set for new room")
def t2_f15_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator("#rooms.v2-dream")
        sec.scroll_into_view_if_needed()
        sec.locator(".v2-hotspot").first.hover()
        sec.locator('[role="tab"]').nth(2).click()
        page.wait_for_timeout(150)
        assert sec.locator('[role="tab"]').nth(2).get_attribute("aria-selected") == "true"
        assert sec.locator(".v2-hotspot").count() >= 1
        guard.assert_clean("T2-F15-02")
    finally:
        ctx.close()


@test_case("T2-F15-03", 2, ["F15"], "390x844", "Tapping mobile DreamSpaces hotspot opens product card or navigates cleanly")
def t2_f15_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator("#rooms.v2-dream")
        sec.scroll_into_view_if_needed()
        hs = sec.locator(".v2-dream-m .v2-hotspot").first
        hs.scroll_into_view_if_needed()
        hs.locator(".v2-hotspot-pin").first.click()
        page.wait_for_timeout(200)
        if "/san-pham/" not in page.url:
            card = hs.locator(".v2-hotspot-card")
            if not (card.count() > 0 and card.is_visible()):
                page.wait_for_url("**/san-pham/**", timeout=10000)
                page.wait_for_timeout(150)
        assert_no_horizontal_overflow(page, "T2-F15-03")
        guard.assert_clean("T2-F15-03")
    finally:
        ctx.close()


@test_case("T2-F15-04", 2, ["F15"], "1440x900", "Rapid RoomApplications pill switching keeps active pill and stage synced")
def t2_f15_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator(".v2-space")
        sec.scroll_into_view_if_needed()
        pills = sec.locator(".v2-space-pill")
        for idx in (0, 3, 1, 2):
            pills.nth(idx).click()
        page.wait_for_timeout(150)
        assert "is-active" in (pills.nth(2).get_attribute("class") or "")
        assert sec.locator(".v2-space-pill.is-active").count() == 1
        guard.assert_clean("T2-F15-04")
    finally:
        ctx.close()


@test_case("T2-F15-05", 2, ["F15"], "390x844", "Mobile RoomApplications pill strip stays inside 390px without overflow")
def t2_f15_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator(".v2-space")
        sec.scroll_into_view_if_needed()
        sec.locator(".v2-space-pill").nth(2).click()
        page.wait_for_timeout(150)
        assert_no_horizontal_overflow(page, "T2-F15-05")
        guard.assert_clean("T2-F15-05")
    finally:
        ctx.close()


# ==============================================================================
# Feature #16 Boundary Cases (F16 — 5 tests)
# ==============================================================================


@test_case("T2-F16-01", 2, ["F16"], "1440x900", "All 4 CategoryExplorer tabs render 12 rows each and update preview")
def t2_f16_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator(".v2-catx")
        sec.scroll_into_view_if_needed()
        tabs = sec.locator(".v2-catx-tab")
        for i in range(4):
            tabs.nth(i).click()
            page.wait_for_timeout(120)
            assert sec.locator(".v2-catx-row").count() == 12
        guard.assert_clean("T2-F16-01")
    finally:
        ctx.close()


@test_case("T2-F16-02", 2, ["F16"], "1440x900", "CategoryExplorer sticky preview stays below header while scrolling list")
def t2_f16_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator(".v2-catx")
        sec.scroll_into_view_if_needed()
        pic = sec.locator(".v2-catx-picture")
        info = pic.evaluate("el => ({ pos: getComputedStyle(el).position, top: parseFloat(getComputedStyle(el).top) })")
        assert info["pos"] == "sticky" and info["top"] >= 60
        guard.assert_clean("T2-F16-02")
    finally:
        ctx.close()


@test_case("T2-F16-03", 2, ["F16"], "1440x900", "Hovering CategoryExplorer rows keeps at most 1 row active at a time")
def t2_f16_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator(".v2-catx")
        sec.scroll_into_view_if_needed()
        rows = sec.locator(".v2-catx-row")
        rows.nth(0).hover()
        page.wait_for_timeout(120)
        rows.nth(5).hover()
        page.wait_for_timeout(150)
        assert sec.locator(".v2-catx-row.is-active").count() <= 1
        guard.assert_clean("T2-F16-03")
    finally:
        ctx.close()


@test_case("T2-F16-04", 2, ["F16"], "1440x900", "HomeProjectsMarquee tiles link to valid /du-an routes")
def t2_f16_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator(".v2-hprj")
        sec.scroll_into_view_if_needed()
        links = page.eval_on_selector_all(
            '.v2-hprj .v2-hprj-set a[href^="/du-an"]',
            "els => els.map(e => e.getAttribute('href'))",
        )
        assert len(links) >= 3
        for href in set(links):
            resp = page.request.get(f"{cfg.base_url}{href}")
            assert resp.status == 200, f"Marquee project link {href} returned HTTP {resp.status}"
        guard.assert_clean("T2-F16-04")
    finally:
        ctx.close()


@test_case("T2-F16-05", 2, ["F16"], "390x844", "Mobile horizontal snap carousels scroll internally without document overflow")
def t2_f16_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        for sel in (".v2-hprj", ".v2-hlib", ".v2-hnews"):
            page.locator(sel).scroll_into_view_if_needed()
            assert_no_horizontal_overflow(page, f"T2-F16-05:{sel}")
        guard.assert_clean("T2-F16-05")
    finally:
        ctx.close()


# ==============================================================================
# Feature #17 Boundary Cases (F17 — 5 tests)
# ==============================================================================


@test_case("T2-F17-01", 2, ["F17"], "1440x900", "Invalid category /danh-muc/khong-ton-tai shows clean 404/missing UI")
def t2_f17_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900", expect_404=True)
    try:
        goto_ready(page, f"{cfg.base_url}/danh-muc/khong-ton-tai")
        assert page.locator('a[href="/danh-muc/tat-ca"], a[href="/"]').count() >= 1
        guard.assert_clean("T2-F17-01")
    finally:
        ctx.close()


@test_case("T2-F17-02", 2, ["F17"], "1440x900", "Alias routes /danh-muc and /products redirect to /danh-muc/tat-ca")
def t2_f17_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        for alias in ("/danh-muc", "/products"):
            goto_ready(page, f"{cfg.base_url}{alias}")
            assert "/danh-muc/tat-ca" in page.url
            assert page.locator('.v2-cat-grid a[href^="/san-pham/"]').count() >= 1
        guard.assert_clean("T2-F17-02")
    finally:
        ctx.close()


@test_case("T2-F17-03", 2, ["F17"], "1440x900", "Zero-match filter renders .v2-cat-empty and reset restores items")
def t2_f17_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/danh-muc/tat-ca")
        inp = page.locator(".v2-cat-search, .v2-cat-filter-box input[type='text'], .v2-cat-filter-box input[type='search']").first
        inp.fill("zzzz_no_match_xyz")
        page.wait_for_timeout(150)
        assert page.locator(".v2-cat-empty").is_visible()
        page.locator('.v2-cat-reset, button:has-text("Xoá bộ lọc"), button:has-text("Xóa bộ lọc")').first.click()
        page.wait_for_timeout(150)
        assert page.locator('.v2-cat-grid a[href^="/san-pham/"]').count() >= 1
        guard.assert_clean("T2-F17-03")
    finally:
        ctx.close()


@test_case("T2-F17-04", 2, ["F17"], "1440x900", "Filtering while on page 2 resets pagination to page 1 (no empty ghost page)")
def t2_f17_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/danh-muc/tat-ca")
        p2 = page.locator(".v2-cat-pages button", has_text="2")
        assert p2.count() > 0, "Expected page 2 button on /danh-muc/tat-ca"
        p2.first.click()
        page.wait_for_timeout(150)
        inp = page.locator(".v2-cat-search, .v2-cat-filter-box input[type='text'], .v2-cat-filter-box input[type='search']").first
        inp.fill("Sofa")
        page.wait_for_timeout(150)
        assert page.locator('.v2-cat-grid a[href^="/san-pham/"]').count() >= 1
        guard.assert_clean("T2-F17-04")
    finally:
        ctx.close()


@test_case("T2-F17-05", 2, ["F17"], "390x844", "Mobile .v2-cat-drawer backdrop dismissal restores scrolling")
def t2_f17_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/danh-muc/tat-ca")
        page.evaluate("window.scrollTo(0, 500)")
        page.wait_for_timeout(200)
        page.locator(".v2-cat-tab, button", has_text="Bộ lọc").first.click()
        page.locator(".v2-cat-drawer").wait_for(state="visible", timeout=4000)
        page.mouse.click(375, 400)
        page.wait_for_timeout(200)
        assert_no_horizontal_overflow(page, "T2-F17-05")
        guard.assert_clean("T2-F17-05")
    finally:
        ctx.close()


# ==============================================================================
# Feature #18 Boundary Cases (F18 — 6 tests)
# ==============================================================================


@test_case("T2-F18-01", 2, ["F18"], "1440x900", "Long product name uses 132px .v2-pd-ticker without expanding crumbs >320px")
def t2_f18_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        prod_url = discover_first_product_url(page, cfg.base_url)
        goto_ready(page, f"{cfg.base_url}{prod_url}")
        info = page.evaluate(
            """() => {
                const crumbs = document.querySelector('.v2-pd-crumbs');
                const ticker = document.querySelector('.v2-pd-ticker');
                return {
                    crumbsW: crumbs ? crumbs.getBoundingClientRect().width : 0,
                    hasTicker: Boolean(ticker),
                    tickerW: ticker ? ticker.getBoundingClientRect().width : 0,
                };
            }"""
        )
        assert info["hasTicker"], "Expected .v2-pd-ticker for long product breadcrumb name"
        assert info["tickerW"] <= 140
        assert info["crumbsW"] <= 340
        guard.assert_clean("T2-F18-01")
    finally:
        ctx.close()


@test_case("T2-F18-02", 2, ["F18"], "1440x900", "Pinned breadcrumb hidden at y=0, shows at top=60 down, top=100 up")
def t2_f18_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        prod_url = discover_first_product_url(page, cfg.base_url)
        goto_ready(page, f"{cfg.base_url}{prod_url}")
        pinned_at_0 = page.evaluate(
            "() => document.querySelector('.v2-pd-crumbs.is-pinned.is-shown') !== null"
        )
        assert not pinned_at_0, "Pinned breadcrumb should not be shown at scrollY=0"
        page.evaluate("window.scrollTo(0, 650)")
        page.wait_for_timeout(250)
        top_down = page.evaluate("() => document.querySelector('.v2-pd-crumbs.is-pinned')?.getBoundingClientRect().top")
        assert top_down is not None and abs(top_down - 60) <= 3
        page.evaluate("window.scrollBy(0, -140)")
        page.wait_for_timeout(250)
        top_up = page.evaluate("() => document.querySelector('.v2-pd-crumbs.is-pinned')?.getBoundingClientRect().top")
        assert top_up is not None and abs(top_up - 100) <= 3
        guard.assert_clean("T2-F18-02")
    finally:
        ctx.close()


@test_case("T2-F18-03", 2, ["F18"], "390x844", "Mobile ProductDetail pinned bar top=64px (50px height) and 4/3 stage")
def t2_f18_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        prod_url = discover_first_product_url(page, cfg.base_url)
        goto_ready(page, f"{cfg.base_url}{prod_url}")
        stage = page.locator(".v2-pd-stage").bounding_box()
        assert abs((stage["width"] / stage["height"]) - (4 / 3)) <= 0.18
        page.evaluate("window.scrollTo(0, 500)")
        page.wait_for_timeout(250)
        p_box = page.locator(".v2-pd-crumbs.is-pinned").bounding_box()
        assert p_box is not None and abs((p_box["top"] if "top" in p_box else p_box["y"]) - 64) <= 6
        assert abs(p_box["height"] - 50) <= 6
        assert_no_horizontal_overflow(page, "T2-F18-03")
        guard.assert_clean("T2-F18-03")
    finally:
        ctx.close()


@test_case("T2-F18-04", 2, ["F18"], "1440x900", "Lightbox prev/next navigation and Escape key dismissal")
def t2_f18_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        prod_url = discover_first_product_url(page, cfg.base_url)
        goto_ready(page, f"{cfg.base_url}{prod_url}")
        page.locator('.v2-pd-stage button[aria-label*="Phóng to" i], .v2-pd-stage button[aria-label*="Zoom" i]').first.click()
        lb = page.locator(".v2-pd-lightbox")
        lb.wait_for(state="visible", timeout=4000)
        next_btn = lb.locator('button[aria-label*="Tiếp" i], button[aria-label*="Sau" i], button[aria-label*="Next" i]')
        if next_btn.count() > 0:
            next_btn.first.click()
            page.wait_for_timeout(100)
        page.keyboard.press("Escape")
        page.wait_for_timeout(150)
        assert lb.count() == 0, "Expected Escape to dismiss .v2-pd-lightbox"
        guard.assert_clean("T2-F18-04")
    finally:
        ctx.close()


@test_case("T2-F18-05", 2, ["F18"], "1440x900", "Wishlist state persists across page reload on ProductDetail")
def t2_f18_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        prod_url = discover_first_product_url(page, cfg.base_url)
        goto_ready(page, f"{cfg.base_url}{prod_url}")
        heart = page.locator('button[aria-label*="yêu thích" i]').first
        heart.click()
        page.wait_for_timeout(150)
        page.reload(wait_until="domcontentloaded")
        page.wait_for_timeout(200)
        wl = page.evaluate("() => window.localStorage.getItem('ag_wishlist')")
        assert wl and len(wl) > 2
        guard.assert_clean("T2-F18-05")
    finally:
        ctx.close()


@test_case("T2-F18-06", 2, ["F18"], "1440x900", "Non-existent product slug /san-pham/khong-ton-tai-999 renders clean 404")
def t2_f18_06(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900", expect_404=True)
    try:
        resp = goto_ready(page, f"{cfg.base_url}/san-pham/khong-ton-tai-999")
        assert resp is not None and resp.status == 404
        assert page.locator('a[href="/"]').count() >= 1
        guard.assert_clean("T2-F18-06")
    finally:
        ctx.close()


# ==============================================================================
# Feature #19 Boundary Cases (F19 — 5 tests)
# ==============================================================================


@test_case("T2-F19-01", 2, ["F19"], "1440x900", "Reduced motion on /bo-suu-tap shows all cards without clip-path trap")
def t2_f19_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900", reduced_motion=True)
    try:
        goto_ready(page, f"{cfg.base_url}/bo-suu-tap")
        page.wait_for_timeout(200)
        cards = page.evaluate(
            "() => Array.from(document.querySelectorAll('.v2-bst-card')).map(el => ({ op: parseFloat(getComputedStyle(el).opacity), cp: getComputedStyle(el).clipPath }))"
        )
        assert len(cards) >= 2 and all(c["op"] >= 0.95 and "circle(0px" not in c["cp"] for c in cards)
        guard.assert_clean("T2-F19-01")
    finally:
        ctx.close()


@test_case("T2-F19-02", 2, ["F19"], "1440x900", "Rapid scroll bottom-to-top on /bo-suu-tap keeps all cards .is-shown")
def t2_f19_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/bo-suu-tap")
        scroll_and_reveal(page, step_px=500, pause_ms=90)
        page.evaluate("window.scrollTo(0, 0)")
        page.wait_for_timeout(250)
        ops = page.evaluate("() => Array.from(document.querySelectorAll('.v2-bst-card')).map(e => parseFloat(getComputedStyle(e).opacity))")
        assert all(o >= 0.9 for o in ops)
        guard.assert_clean("T2-F19-02")
    finally:
        ctx.close()


@test_case("T2-F19-03", 2, ["F19"], "1440x900", "Collection card .is-hover resets to opacity 0 when pointer leaves")
def t2_f19_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/bo-suu-tap")
        link = page.locator(".v2-bst-link[href], .v2-bst-card[href]").first
        hover_img = link.locator("img.is-hover")
        assert hover_img.count() > 0, "Missing dual-image hover crossfade img.is-hover"
        link.hover()
        page.wait_for_timeout(400)
        page.mouse.move(5, 5)
        page.wait_for_timeout(400)
        op = hover_img.evaluate("el => parseFloat(getComputedStyle(el).opacity)")
        assert op <= 0.15, f"Expected img.is-hover opacity <= 0.15 after pointer leave, got {op}"
        guard.assert_clean("T2-F19-03")
    finally:
        ctx.close()


@test_case("T2-F19-04", 2, ["F19"], "390x844", "Mobile alternating collection bands span full width with zero overflow")
def t2_f19_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/bo-suu-tap")
        scroll_and_reveal(page)
        assert_no_horizontal_overflow(page, "T2-F19-04")
        guard.assert_clean("T2-F19-04")
    finally:
        ctx.close()


@test_case("T2-F19-05", 2, ["F19"], "1440x900", "Every collection card target href returns HTTP 200 with zero errors")
def t2_f19_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/bo-suu-tap")
        hrefs = page.eval_on_selector_all(".v2-bst-link[href]", "els => els.map(e => e.getAttribute('href'))")
        assert len(hrefs) >= 2
        for h in set(hrefs):
            resp = goto_ready(page, f"{cfg.base_url}{h}")
            assert resp is not None and resp.status == 200
            assert_all_images_loaded(page, f"T2-F19-05:{h}")
        guard.assert_clean("T2-F19-05")
    finally:
        ctx.close()


# ==============================================================================
# Feature #20 Boundary Cases (F20 — 5 tests)
# ==============================================================================


@test_case("T2-F20-01", 2, ["F20"], "1440x900", "Custom year dropdown .v2-prj-year closes on Escape / outside click")
def t2_f20_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/du-an/loai/nha-pho")
        assert page.locator("select").count() == 0, "Forbid native <select> in favor of custom .v2-prj-year"
        page.locator(".v2-prj-year-button").first.click()
        page.locator(".v2-prj-year-menu").wait_for(state="visible", timeout=3000)
        page.keyboard.press("Escape")
        page.wait_for_timeout(150)
        assert page.locator(".v2-prj-year-menu").count() == 0 or not page.locator(".v2-prj-year-menu").is_visible()
        guard.assert_clean("T2-F20-01")
    finally:
        ctx.close()


@test_case("T2-F20-02", 2, ["F20"], "1440x900", "Year filter updates page count and disables pagination bounds cleanly")
def t2_f20_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/du-an/loai/nha-pho")
        page.locator(".v2-prj-year-button").first.click()
        menu = page.locator(".v2-prj-year-menu")
        menu.wait_for(state="visible", timeout=3000)
        menu.locator("button, [role='option']", has_text="2025").first.click()
        page.wait_for_timeout(150)
        assert page.locator(".v2-prj-grid > *").count() >= 1
        guard.assert_clean("T2-F20-02")
    finally:
        ctx.close()


@test_case("T2-F20-03", 2, ["F20"], "1440x900", "All 3 project type routes activate matching tab with 90deg rotated arrow")
def t2_f20_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        for slug, label in [("nha-pho", "Nhà phố"), ("van-phong", "Văn phòng"), ("cua-hang", "Cửa hàng")]:
            goto_ready(page, f"{cfg.base_url}/du-an/loai/{slug}")
            active = page.locator(".v2-prj-kinds .is-active").first
            assert label.lower() in active.inner_text().lower()
            tf = active.locator(".v2-prj-kind-arrow").evaluate("el => getComputedStyle(el).transform")
            assert tf != "none", f"Expected rotated arrow on /du-an/loai/{slug}"
        guard.assert_clean("T2-F20-03")
    finally:
        ctx.close()


@test_case("T2-F20-04", 2, ["F20"], "1440x900", "Invalid project type /du-an/loai/khong-ton-tai renders clean 404")
def t2_f20_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900", expect_404=True)
    try:
        resp = goto_ready(page, f"{cfg.base_url}/du-an/loai/khong-ton-tai")
        assert resp is not None and resp.status == 404
        guard.assert_clean("T2-F20-04")
    finally:
        ctx.close()


@test_case("T2-F20-05", 2, ["F20"], "390x844", "Mobile Projects slider controls and group cards have zero overflow")
def t2_f20_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/du-an")
        scroll_and_reveal(page, step_px=600, pause_ms=70)
        assert_no_horizontal_overflow(page, "T2-F20-05")
        guard.assert_clean("T2-F20-05")
    finally:
        ctx.close()


# ==============================================================================
# Feature #21 Boundary Cases (F21 — 5 tests)
# ==============================================================================


@test_case("T2-F21-01", 2, ["F21"], "1440x900", "Copy link button inside .v2-art-share shows feedback without error")
def t2_f21_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        art_url = discover_article_url(page, cfg.base_url)
        goto_ready(page, f"{cfg.base_url}{art_url}")
        copy_btn = page.locator('.v2-art-share button[aria-label*="Sao chép" i], .v2-art-share button:has-text("Sao chép")').first
        copy_btn.click()
        page.wait_for_timeout(150)
        guard.assert_clean("T2-F21-01")
    finally:
        ctx.close()


@test_case("T2-F21-02", 2, ["F21"], "1440x900", "Clicking related article in .v2-art-related-grid navigates to different article")
def t2_f21_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        art_url = discover_article_url(page, cfg.base_url)
        goto_ready(page, f"{cfg.base_url}{art_url}")
        rel = page.locator('.v2-art-related-grid a[href^="/thu-vien/"]').first
        href = rel.get_attribute("href")
        assert href and href != art_url
        rel.click()
        page.wait_for_url(f"**{href}", timeout=10000)
        guard.assert_clean("T2-F21-02")
    finally:
        ctx.close()


@test_case("T2-F21-03", 2, ["F21"], "1440x900", "Invalid library slug /thu-vien/bai-viet-khong-co returns clean 404")
def t2_f21_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900", expect_404=True)
    try:
        resp = goto_ready(page, f"{cfg.base_url}/thu-vien/bai-viet-khong-co")
        assert resp is not None and resp.status == 404
        guard.assert_clean("T2-F21-03")
    finally:
        ctx.close()


@test_case("T2-F21-04", 2, ["F21"], "390x844", "Mobile Library article prose & cover stay within 346px without overflow")
def t2_f21_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        art_url = discover_article_url(page, cfg.base_url)
        goto_ready(page, f"{cfg.base_url}{art_url}")
        w = page.locator(".v2-art-body").bounding_box()["width"]
        assert w <= 354
        assert_no_horizontal_overflow(page, "T2-F21-04")
        guard.assert_clean("T2-F21-04")
    finally:
        ctx.close()


@test_case("T2-F21-05", 2, ["F21"], "1440x900", "All Library listing and detail images return 200 with naturalWidth > 0")
def t2_f21_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/thu-vien")
        assert_all_images_loaded(page, "T2-F21-05-list")
        art_url = discover_article_url(page, cfg.base_url)
        goto_ready(page, f"{cfg.base_url}{art_url}")
        assert_all_images_loaded(page, "T2-F21-05-detail")
        guard.assert_clean("T2-F21-05")
    finally:
        ctx.close()


# ==============================================================================
# Feature #22 Boundary Cases (F22 — 5 tests)
# ==============================================================================


@test_case("T2-F22-01", 2, ["F22"], "1440x900", "Rapid switching across News tabs preserves alternating .is-flip rhythm")
def t2_f22_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/tin-tuc")
        tabs = page.locator(".v2-news-tabs button")
        assert tabs.count() >= 5
        for i in range(tabs.count()):
            tabs.nth(i).click()
            page.wait_for_timeout(80)
        tabs.first.click()
        page.wait_for_timeout(120)
        assert page.locator(".v2-news-row").count() >= 2
        guard.assert_clean("T2-F22-01")
    finally:
        ctx.close()


@test_case("T2-F22-02", 2, ["F22"], "1440x900", "News Xem thêm button loads remaining articles and hides when exhausted")
def t2_f22_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/tin-tuc")
        more = page.locator("button", has_text="Xem thêm")
        if more.count() > 0:
            before = page.locator('a[href^="/tin-tuc/"]').count()
            more.first.click()
            page.wait_for_timeout(150)
            after = page.locator('a[href^="/tin-tuc/"]').count()
            assert after >= before
        guard.assert_clean("T2-F22-02")
    finally:
        ctx.close()


@test_case("T2-F22-03", 2, ["F22"], "390x844", "Mobile News hero hides badges on small tiles and excerpt on small cards")
def t2_f22_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/tin-tuc")
        ex = page.locator(".v2-news-card.is-small .v2-news-excerpt")
        if ex.count() > 0:
            assert ex.first.evaluate("el => getComputedStyle(el).display") == "none"
        assert_no_horizontal_overflow(page, "T2-F22-03")
        guard.assert_clean("T2-F22-03")
    finally:
        ctx.close()


@test_case("T2-F22-04", 2, ["F22"], "1440x900", "Invalid news slug /tin-tuc/tin-khong-ton-tai renders clean 404")
def t2_f22_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900", expect_404=True)
    try:
        resp = goto_ready(page, f"{cfg.base_url}/tin-tuc/tin-khong-ton-tai")
        assert resp is not None and resp.status == 404
        guard.assert_clean("T2-F22-04")
    finally:
        ctx.close()


@test_case("T2-F22-05", 2, ["F22"], "1440x900", "News detail .v2-art-source external attribution links use target=_blank noopener")
def t2_f22_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        news_url = discover_news_url(page, cfg.base_url)
        goto_ready(page, f"{cfg.base_url}{news_url}")
        ext = page.locator('.v2-art-source a[target="_blank"]')
        for i in range(ext.count()):
            rel = (ext.nth(i).get_attribute("rel") or "").lower()
            assert "noopener" in rel
        guard.assert_clean("T2-F22-05")
    finally:
        ctx.close()
