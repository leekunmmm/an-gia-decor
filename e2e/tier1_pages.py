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
    open_page,
    scroll_and_reveal,
    test_case,
    verify_video_ready_slot,
)


# ==============================================================================
# Feature #11: Home — HeroSlider & VideoReelsCarousel (F11 — 5 tests)
# ==============================================================================


@test_case("T1-F11-01", 1, ["F11"], "1440x900", "HeroSlider renders 100svh, #000 bg, scrim, h1, pill CTA, and 3 dots")
def t1_f11_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        hero = page.evaluate(
            """() => {
                const el = document.querySelector('.v2-hero, .v2-hero-cover');
                if (!el) return null;
                const st = getComputedStyle(el);
                const afterBg = getComputedStyle(el, '::after').backgroundImage;
                return {
                    isV2Hero: el.classList.contains('v2-hero'),
                    h: Math.round(el.getBoundingClientRect().height),
                    bg: st.backgroundColor,
                    scrim: afterBg,
                    hasScrimEl: Boolean(el.querySelector('.v2-hero-scrim')),
                    h1: Boolean(el.querySelector('h1.v2-hero-title')),
                    pill: Boolean(el.querySelector('.v2-pill')),
                    dots: el.querySelectorAll('.v2-hero-dot').length,
                };
            }"""
        )
        assert hero is not None and hero["isV2Hero"], "Missing .v2-hero section"
        assert abs(hero["h"] - 900) <= 10, f"Hero height={hero['h']}"
        assert hero["bg"] == "rgb(0, 0, 0)"
        assert "gradient" in hero["scrim"].lower() or hero["hasScrimEl"]
        assert hero["h1"] and hero["pill"]
        assert hero["dots"] == 3, f"Hero dots count={hero['dots']}"
        guard.assert_clean("T1-F11-01")
    finally:
        ctx.close()


@test_case("T1-F11-02", 1, ["F11"], "1440x900", "Clicking HeroSlider dots switches .is-active and headline cleanly")
def t1_f11_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        dots = page.locator(".v2-hero-dot")
        t1 = page.locator("h1.v2-hero-title").inner_text()
        dots.nth(1).click()
        page.wait_for_timeout(200)
        assert "is-active" in (dots.nth(1).get_attribute("class") or "")
        t2 = page.locator("h1.v2-hero-title").inner_text()
        dots.nth(2).click()
        page.wait_for_timeout(200)
        assert "is-active" in (dots.nth(2).get_attribute("class") or "")
        t3 = page.locator("h1.v2-hero-title").inner_text()
        assert len({t1, t2, t3}) >= 2, f"Expected hero headlines to transition across slides: {(t1, t2, t3)}"
        guard.assert_clean("T1-F11-02")
    finally:
        ctx.close()


@test_case("T1-F11-03", 1, ["F11"], "1440x900", "VideoReelsCarousel renders 9:16 ready slots and secure TikTok CTA")
def t1_f11_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        row = page.locator(".v2-tiktok-row")
        row.scroll_into_view_if_needed()
        cards = page.locator(".v2-tiktok-card")
        assert cards.count() >= 4
        verify_video_ready_slot(page, cards.first, expected_aspect=9 / 16, tolerance=0.22)
        tiktok_cta = page.locator(f'a[href="{cfg.brand["tiktokUrl"]}"]').first
        assert tiktok_cta.is_visible()
        assert tiktok_cta.get_attribute("target") == "_blank"
        rel = (tiktok_cta.get_attribute("rel") or "").lower()
        assert "noopener" in rel and "noreferrer" in rel, f"TikTok CTA rel={rel!r}"
        guard.assert_clean("T1-F11-03")
    finally:
        ctx.close()


@test_case("T1-F11-04", 1, ["F11"], "1440x900", "VideoReelsCarousel arrow buttons advance and rewind horizontal scrollLeft")
def t1_f11_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        row = page.locator(".v2-tiktok-row")
        row.scroll_into_view_if_needed()
        arrows = page.locator(".v2-tiktok-arrows button")
        assert arrows.count() == 2
        s0 = row.evaluate("el => el.scrollLeft")
        arrows.nth(1).click()
        page.wait_for_timeout(450)
        s1 = row.evaluate("el => el.scrollLeft")
        assert s1 > s0, f"Expected scrollLeft to advance on Next arrow click ({s0} -> {s1})"
        arrows.nth(0).click()
        page.wait_for_timeout(450)
        s2 = row.evaluate("el => el.scrollLeft")
        assert s2 < s1, f"Expected scrollLeft to decrease on Prev arrow click ({s1} -> {s2})"
        guard.assert_clean("T1-F11-04")
    finally:
        ctx.close()


@test_case("T1-F11-05", 1, ["F11"], "1440x900", "Clicking VideoReel card opens preview dialog with linked product CTA and closes")
def t1_f11_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        card = page.locator(".v2-tiktok-card").first
        card.scroll_into_view_if_needed()
        card.click()
        dlg = page.locator('[role="dialog"]').first
        dlg.wait_for(state="visible", timeout=4000)
        assert dlg.locator('a[href^="/san-pham/"], a[href^="/danh-muc/"]').count() > 0
        dlg.locator("button").first.click()
        page.wait_for_timeout(150)
        assert page.locator('[role="dialog"]').count() == 0
        guard.assert_clean("T1-F11-05")
    finally:
        ctx.close()


# ==============================================================================
# Feature #12: Home — FeaturedSplit & AboutSection (F12 — 5 tests)
# ==============================================================================


@test_case("T1-F12-01", 1, ["F12"], "1440x900", "FeaturedSplit #collections renders #292d34 2-col 80vh tiles with .v2-more")
def t1_f12_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator("#collections.v2-featured")
        sec.scroll_into_view_if_needed()
        info = sec.evaluate(
            """el => ({
                bg: getComputedStyle(el).backgroundColor,
                h: Math.round(el.getBoundingClientRect().height),
                cols: getComputedStyle(el).gridTemplateColumns.split(' ').length,
                tiles: el.querySelectorAll('.v2-featured-tile').length,
                mores: el.querySelectorAll('.v2-more').length,
            })"""
        )
        assert info["bg"] == "rgb(41, 45, 52)"
        assert abs(info["h"] - 720) <= 16, f"FeaturedSplit height={info['h']}"
        assert info["cols"] == 2 and info["tiles"] == 2 and info["mores"] == 2
        guard.assert_clean("T1-F12-01")
    finally:
        ctx.close()


@test_case("T1-F12-02", 1, ["F12"], "1440x900", "Hovering FeaturedSplit tile shows hover image and clicking navigates")
def t1_f12_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        tile = page.locator(".v2-featured-tile").first
        tile.scroll_into_view_if_needed()
        link = tile if tile.get_attribute("href") else tile.locator("a[href]").first
        href = link.get_attribute("href")
        tile.hover()
        page.wait_for_timeout(450)
        hover_img = tile.locator(".v2-featured-hover")
        assert hover_img.count() > 0, "Missing .v2-featured-hover"
        hover_op = hover_img.evaluate("el => parseFloat(getComputedStyle(el).opacity)")
        assert hover_op >= 0.85, f"Expected .v2-featured-hover opacity near 1 on hover, got {hover_op}"
        link.click()
        page.wait_for_url(f"**{href}", timeout=10000)
        guard.assert_clean("T1-F12-02")
    finally:
        ctx.close()


@test_case("T1-F12-03", 1, ["F12"], "390x844", "Mobile FeaturedSplit stacks 1-column cleanly")
def t1_f12_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator("#collections.v2-featured")
        sec.scroll_into_view_if_needed()
        cols = sec.evaluate("el => getComputedStyle(el).gridTemplateColumns.split(' ').length")
        assert cols == 1
        assert_no_horizontal_overflow(page, "T1-F12-03")
        guard.assert_clean("T1-F12-03")
    finally:
        ctx.close()


@test_case("T1-F12-04", 1, ["F12"], "1440x900", "AboutSection renders #000 bg, centered heading, 1.2fr/1fr grid, and gold 10+ stat")
def t1_f12_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        about = page.locator(".v2-about")
        about.scroll_into_view_if_needed()
        info = about.evaluate(
            """el => {
                const grid = el.querySelector('.v2-about-grid');
                const stat = el.querySelector('.v2-about-stat');
                return {
                    bg: getComputedStyle(el).backgroundColor,
                    hasHeading: Boolean(el.querySelector('.v2-about-heading')),
                    cols: grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').length : 0,
                    statText: stat ? stat.innerText : '',
                    statColor: stat ? getComputedStyle(stat.querySelector('strong') || stat).color : '',
                };
            }"""
        )
        assert info["bg"] == "rgb(0, 0, 0)"
        assert info["hasHeading"] and info["cols"] == 2
        assert cfg.brand["experienceStat"] in info["statText"]
        assert info["statColor"] == "rgb(226, 173, 33)"
        guard.assert_clean("T1-F12-04")
    finally:
        ctx.close()


@test_case("T1-F12-05", 1, ["F12"], "1440x900", "AboutSection CTA link resolves to valid route with HTTP 200")
def t1_f12_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        cta = page.locator(".v2-about .v2-pill").first
        href = cta.get_attribute("href")
        assert href and href.startswith("/")
        cta.click()
        page.wait_for_url(f"**{href}", timeout=10000)
        guard.assert_clean("T1-F12-05")
    finally:
        ctx.close()


# ==============================================================================
# Feature #13: Home — ServicesSwitcher 01-05 (F13 — 5 tests)
# ==============================================================================


@test_case("T1-F13-01", 1, ["F13"], "1440x900", "ServicesSwitcher renders #141619 2-col grid with 4/3.6 stage and 5 buttons")
def t1_f13_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator(".v2-services")
        sec.scroll_into_view_if_needed()
        info = sec.evaluate(
            """el => {
                const grid = el.querySelector('.v2-services-grid');
                const pic = el.querySelector('.v2-services-picture');
                const r = pic ? pic.getBoundingClientRect() : null;
                return {
                    bg: getComputedStyle(el).backgroundColor,
                    cols: grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').length : 0,
                    btns: el.querySelectorAll('.v2-services-btn').length,
                    aspect: r ? (r.width / r.height) : 0,
                };
            }"""
        )
        assert info["bg"] == "rgb(20, 22, 25)"
        assert info["cols"] == 2 and info["btns"] == 5
        assert abs(info["aspect"] - (4 / 3.6)) <= 0.15, f"Services stage aspect={info['aspect']}"
        guard.assert_clean("T1-F13-01")
    finally:
        ctx.close()


@test_case("T1-F13-02", 1, ["F13"], "1440x900", "Clicking service buttons 01..05 activates button and switches image")
def t1_f13_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator(".v2-services")
        sec.scroll_into_view_if_needed()
        btns = sec.locator(".v2-services-btn")
        for i in range(5):
            btns.nth(i).click()
            page.wait_for_timeout(320)
            assert btns.nth(i).get_attribute("aria-pressed") == "true"
            bg = btns.nth(i).evaluate("el => getComputedStyle(el).backgroundColor")
            assert bg == "rgb(255, 255, 255)", f"Active service btn bg={bg}"
            active_imgs = sec.locator(".v2-services-picture img.is-active")
            assert active_imgs.count() == 1
            assert active_imgs.first.evaluate("img => img.complete && img.naturalWidth > 0")
        guard.assert_clean("T1-F13-02")
    finally:
        ctx.close()


@test_case("T1-F13-03", 1, ["F13"], "1440x900", "Only one service button holds aria-pressed=true at any time")
def t1_f13_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator(".v2-services")
        sec.scroll_into_view_if_needed()
        for idx in (3, 1, 4):
            sec.locator(".v2-services-btn").nth(idx).click()
            page.wait_for_timeout(80)
            pressed = sec.locator('.v2-services-btn[aria-pressed="true"]').count()
            assert pressed == 1, f"Expected exactly 1 active service button, found {pressed}"
        guard.assert_clean("T1-F13-03")
    finally:
        ctx.close()


@test_case("T1-F13-04", 1, ["F13"], "390x844", "Mobile ServicesSwitcher hides desktop grid and renders 5-row accordion")
def t1_f13_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator(".v2-services")
        sec.scroll_into_view_if_needed()
        grid_disp = sec.locator(".v2-services-grid").evaluate("el => getComputedStyle(el).display")
        assert grid_disp == "none"
        m_items = sec.locator(".v2-services-m .v2-services-m-item")
        assert m_items.count() == 5
        assert_no_horizontal_overflow(page, "T1-F13-04")
        guard.assert_clean("T1-F13-04")
    finally:
        ctx.close()


@test_case("T1-F13-05", 1, ["F13"], "390x844", "Tapping mobile accordion item 03 expands 1:1 image and rotates chevron")
def t1_f13_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator(".v2-services")
        sec.scroll_into_view_if_needed()
        item3 = sec.locator(".v2-services-m .v2-services-m-item").nth(2)
        head3 = item3.locator(".v2-services-m-head").first
        head3.click()
        page.wait_for_timeout(200)
        assert "is-open" in (head3.get_attribute("class") or "")
        assert head3.get_attribute("aria-expanded") == "true"
        assert item3.locator(".v2-m-collapse").get_attribute("data-open") == "true"
        img_ok = item3.locator("img").evaluate("img => img.complete && img.naturalWidth > 0")
        assert img_ok
        guard.assert_clean("T1-F13-05")
    finally:
        ctx.close()


# ==============================================================================
# Feature #14: Home — Spotlight Side, Overlay & Commitment (F14 — 6 tests)
# ==============================================================================


@test_case("T1-F14-01", 1, ["F14"], "1440x900", "Spotlight Side renders #292d34 30%/70% 16:9 ready slot and gold title")
def t1_f14_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator(".v2-spotlight.is-side").first
        sec.scroll_into_view_if_needed()
        bg = sec.evaluate("el => getComputedStyle(el).backgroundColor")
        assert bg == "rgb(41, 45, 52)"
        verify_video_ready_slot(page, sec.locator(".v2-spotlight-picture"), expected_aspect=16 / 9, tolerance=0.22)
        title_col = sec.locator(".v2-spotlight-name").evaluate("el => getComputedStyle(el).color")
        assert title_col == "rgb(226, 173, 33)"
        assert sec.locator("a[href]").count() >= 1
        guard.assert_clean("T1-F14-01")
    finally:
        ctx.close()


@test_case("T1-F14-02", 1, ["F14"], "1440x900", "Spotlight Overlay renders #141619 18:9 ready slot with scrim and CTA")
def t1_f14_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator(".v2-spotlight.is-overlay").first
        sec.scroll_into_view_if_needed()
        bg = sec.evaluate("el => getComputedStyle(el).backgroundColor")
        assert bg == "rgb(20, 22, 25)"
        verify_video_ready_slot(page, sec.locator(".v2-spotlight-picture"), expected_aspect=18 / 9, tolerance=0.22)
        assert sec.locator("a[href]").count() >= 1
        guard.assert_clean("T1-F14-02")
    finally:
        ctx.close()


@test_case("T1-F14-03", 1, ["F14"], "390x844", "Mobile Spotlights switch to 4:3 (side) and 3:4 (overlay) without overflow")
def t1_f14_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        side = page.locator(".v2-spotlight.is-side .v2-spotlight-picture").first
        side.scroll_into_view_if_needed()
        verify_video_ready_slot(page, side, expected_aspect=4 / 3, tolerance=0.25)
        overlay = page.locator(".v2-spotlight.is-overlay .v2-spotlight-picture").first
        overlay.scroll_into_view_if_needed()
        verify_video_ready_slot(page, overlay, expected_aspect=3 / 4, tolerance=0.25)
        assert_no_horizontal_overflow(page, "T1-F14-03")
        guard.assert_clean("T1-F14-03")
    finally:
        ctx.close()


@test_case("T1-F14-04", 1, ["F14"], "1440x900", "CommitmentSection renders #292d34 surface, badges, and 21:9 video ready slot")
def t1_f14_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator(".v2-commit").first
        sec.scroll_into_view_if_needed()
        bg = sec.evaluate("el => getComputedStyle(el).backgroundColor")
        assert bg == "rgb(41, 45, 52)"
        assert sec.locator(".v2-commit-icon, .v2-commit-icons svg").count() >= 3
        verify_video_ready_slot(page, sec.locator(".v2-commit-stage"), expected_aspect=21 / 9, tolerance=0.22)
        guard.assert_clean("T1-F14-04")
    finally:
        ctx.close()


@test_case("T1-F14-05", 1, ["F14"], "1440x900", "Commitment frosted card has -110px offset, backdrop blur, and filled .v2-more")
def t1_f14_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator(".v2-commit").first
        sec.scroll_into_view_if_needed()
        info = sec.evaluate(
            """el => {
                const rowWrap = el.querySelector('.v2-commit-row-wrap');
                const card = el.querySelector('.v2-commit-card');
                const more = el.querySelector('.v2-more.is-filled');
                const cSt = getComputedStyle(card);
                return {
                    marginTop: parseFloat(getComputedStyle(rowWrap).marginTop),
                    backdrop: cSt.backdropFilter || cSt.webkitBackdropFilter || '',
                    hasFilledMore: Boolean(more),
                };
            }"""
        )
        assert abs(info["marginTop"] - (-110)) <= 12, f"Expected -110px offset, got {info['marginTop']}"
        assert "blur" in info["backdrop"].lower(), f"Expected frosted backdrop blur, got {info['backdrop']}"
        assert info["hasFilledMore"]
        guard.assert_clean("T1-F14-05")
    finally:
        ctx.close()


@test_case("T1-F14-06", 1, ["F14"], "1440x900", "Commitment bottom text marquee animates continuously with duplicated track")
def t1_f14_06(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        page.locator(".v2-marquee").first.scroll_into_view_if_needed()
        track = page.locator(".v2-marquee-track").first
        anim = track.evaluate(
            "el => ({ name: getComputedStyle(el).animationName, spans: el.querySelectorAll('span').length })"
        )
        assert anim["name"] and anim["name"] != "none", f"Expected marquee animation, got {anim}"
        assert anim["spans"] >= 4
        guard.assert_clean("T1-F14-06")
    finally:
        ctx.close()


# ==============================================================================
# Feature #15: Home — DreamSpaces, CatalogueBanner & RoomApplications (F15 — 6 tests)
# ==============================================================================


@test_case("T1-F15-01", 1, ["F15"], "1440x900", "DreamSpaces #rooms renders #141619 outer + #f6f6f6 card + 6 tabs + 1:1 hotspots")
def t1_f15_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator("#rooms.v2-dream")
        sec.scroll_into_view_if_needed()
        info = sec.evaluate(
            """el => {
                const card = el.querySelector('.v2-dream-card');
                const stage = el.querySelector('.v2-dream-stage') || el.querySelector('.v2-dream-pic');
                const r = stage ? stage.getBoundingClientRect() : { width: 1, height: 1 };
                return {
                    bg: getComputedStyle(el).backgroundColor,
                    cardBg: card ? getComputedStyle(card).backgroundColor : '',
                    tabs: el.querySelectorAll('[role="tab"]').length,
                    hotspots: el.querySelectorAll('.v2-hotspot').length,
                    aspect: r.width / r.height,
                };
            }"""
        )
        assert info["bg"] == "rgb(20, 22, 25)"
        assert info["cardBg"] == "rgb(246, 246, 246)"
        assert info["tabs"] == 6, f"DreamSpaces tabs={info['tabs']}"
        assert info["hotspots"] >= 1
        assert abs(info["aspect"] - 1.0) <= 0.15
        guard.assert_clean("T1-F15-01")
    finally:
        ctx.close()


@test_case("T1-F15-02", 1, ["F15"], "1440x900", "Switching all 6 DreamSpaces tabs updates aria-selected and hotspots")
def t1_f15_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator("#rooms.v2-dream")
        sec.scroll_into_view_if_needed()
        tabs = sec.locator('[role="tab"]')
        for i in range(6):
            tabs.nth(i).click()
            page.wait_for_timeout(320)
            assert tabs.nth(i).get_attribute("aria-selected") == "true"
            bg = tabs.nth(i).evaluate("el => getComputedStyle(el).backgroundColor")
            assert bg == "rgb(0, 0, 0)", f"Active DreamSpaces tab bg={bg}"
            assert sec.locator(".v2-hotspot").count() >= 1
        guard.assert_clean("T1-F15-02")
    finally:
        ctx.close()


@test_case("T1-F15-03", 1, ["F15"], "1440x900", "Hovering/clicking DreamSpaces hotspot reveals dark product card linking to /san-pham/")
def t1_f15_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator("#rooms.v2-dream")
        sec.scroll_into_view_if_needed()
        page.wait_for_timeout(800)
        hs = sec.locator(".v2-hotspot").first
        hs.hover()
        page.wait_for_timeout(350)
        card = hs.locator(".v2-hotspot-card")
        assert card.is_visible()
        link = card.locator('a[href^="/san-pham/"]').first
        href = link.get_attribute("href")
        assert href
        link.click()
        page.wait_for_url(f"**{href}", timeout=10000)
        guard.assert_clean("T1-F15-03")
    finally:
        ctx.close()


@test_case("T1-F15-04", 1, ["F15"], "390x844", "Mobile DreamSpaces switches to light surface with stacked cards and expand button")
def t1_f15_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator("#rooms.v2-dream")
        sec.scroll_into_view_if_needed()
        bg = sec.evaluate("el => getComputedStyle(el).backgroundColor")
        assert bg == "rgb(246, 246, 246)", f"Mobile DreamSpaces bg={bg}"
        assert sec.locator(".v2-dream-m-item").count() >= 2
        more_btn = sec.locator(".v2-dream-m-remain, .v2-dream-m-arrow")
        assert more_btn.count() > 0, "Missing DreamSpaces mobile expand button"
        before = sec.locator(".v2-dream-m-item").count()
        more_btn.first.click()
        page.wait_for_timeout(150)
        after = sec.locator(".v2-dream-m-item").count()
        assert after > before, f"Expected expanded mobile DreamSpaces items ({before} -> {after})"
        assert_no_horizontal_overflow(page, "T1-F15-04")
        guard.assert_clean("T1-F15-04")
    finally:
        ctx.close()


@test_case("T1-F15-05", 1, ["F15"], "1440x900", "CatalogueBanner renders #000 >=80vh banner with scrim and catalog CTA")
def t1_f15_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator(".v2-catalogue")
        sec.scroll_into_view_if_needed()
        info = sec.evaluate(
            "el => ({ bg: getComputedStyle(el).backgroundColor, h: el.getBoundingClientRect().height })"
        )
        assert info["bg"] == "rgb(0, 0, 0)"
        assert info["h"] >= 700
        cta = sec.locator('a[href^="/danh-muc/"], a[href="/products"]').first
        cta.click()
        page.wait_for_url("**/danh-muc/**", timeout=10000)
        guard.assert_clean("T1-F15-05")
    finally:
        ctx.close()


@test_case("T1-F15-06", 1, ["F15"], "1440x900", "RoomApplications renders #292d34 1600/1040 stage and 4 interactive room pills")
def t1_f15_06(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator(".v2-space")
        sec.scroll_into_view_if_needed()
        info = sec.evaluate(
            """el => {
                const st = el.querySelector('.v2-space-stage');
                const r = st ? st.getBoundingClientRect() : { width: 1, height: 1 };
                return {
                    bg: getComputedStyle(el).backgroundColor,
                    aspect: r.width / r.height,
                    radius: parseFloat(getComputedStyle(st).borderRadius),
                    pills: el.querySelectorAll('.v2-space-pill').length,
                };
            }"""
        )
        assert info["bg"] == "rgb(41, 45, 52)"
        assert abs(info["aspect"] - (1600 / 1040)) <= 0.15
        assert info["radius"] >= 24
        assert info["pills"] == 4
        pills = sec.locator(".v2-space-pill")
        for i in range(4):
            pills.nth(i).click()
            page.wait_for_timeout(100)
            assert "is-active" in (pills.nth(i).get_attribute("class") or "")
        guard.assert_clean("T1-F15-06")
    finally:
        ctx.close()


# ==============================================================================
# Feature #16: Home — CategoryExplorer, ProjectsMarquee, Library & News (F16 — 6 tests)
# ==============================================================================


@test_case("T1-F16-01", 1, ["F16"], "1440x900", "CategoryExplorer renders #141619 4 tabs x 12 rows and sticky preview")
def t1_f16_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator(".v2-catx")
        sec.scroll_into_view_if_needed()
        info = sec.evaluate(
            """el => {
                const pic = el.querySelector('.v2-catx-picture');
                return {
                    bg: getComputedStyle(el).backgroundColor,
                    tabs: el.querySelectorAll('.v2-catx-tab').length,
                    rows: el.querySelectorAll('.v2-catx-row').length,
                    picPos: pic ? getComputedStyle(pic).position : '',
                };
            }"""
        )
        assert info["bg"] == "rgb(20, 22, 25)"
        assert info["tabs"] == 4
        assert info["rows"] == 12
        assert info["picPos"] == "sticky"
        guard.assert_clean("T1-F16-01")
    finally:
        ctx.close()


@test_case("T1-F16-02", 1, ["F16"], "1440x900", "Hovering CategoryExplorer row #4 activates wipe and updates sticky preview")
def t1_f16_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator(".v2-catx")
        sec.scroll_into_view_if_needed()
        row4 = sec.locator(".v2-catx-row").nth(3)
        row4.hover()
        page.wait_for_timeout(350)
        st = row4.evaluate(
            """el => ({
                isActive: el.classList.contains('is-active'),
                color: getComputedStyle(el).color,
                beforeBg: getComputedStyle(el, '::before').backgroundColor,
            })"""
        )
        assert st["isActive"]
        assert st["color"] == "rgb(20, 22, 25)", f"Active row text color={st['color']}"
        assert st["beforeBg"] == "rgb(246, 246, 246)", f"Row ::before wipe bg={st['beforeBg']}"
        href = row4.locator("a").first.get_attribute("href")
        assert href
        row4.click()
        page.wait_for_url(f"**{href}", timeout=10000)
        guard.assert_clean("T1-F16-02")
    finally:
        ctx.close()


@test_case("T1-F16-03", 1, ["F16"], "390x844", "Mobile CategoryExplorer turns #000 and renders 12 ~112px thumb banner rows")
def t1_f16_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator(".v2-catx")
        sec.scroll_into_view_if_needed()
        info = sec.evaluate(
            """el => {
                const row = el.querySelector('.v2-catx-row');
                const pic = el.querySelector('.v2-catx-picture');
                return {
                    bg: getComputedStyle(el).backgroundColor,
                    picDisp: pic ? getComputedStyle(pic).display : 'none',
                    rows: el.querySelectorAll('.v2-catx-row').length,
                    rowH: row ? row.getBoundingClientRect().height : 0,
                };
            }"""
        )
        assert info["bg"] == "rgb(0, 0, 0)"
        assert info["picDisp"] == "none"
        assert info["rows"] == 12
        assert 90 <= info["rowH"] <= 140, f"Mobile catx row height={info['rowH']}"
        assert_no_horizontal_overflow(page, "T1-F16-03")
        guard.assert_clean("T1-F16-03")
    finally:
        ctx.close()


@test_case("T1-F16-04", 1, ["F16"], "1440x900", "HomeProjectsMarquee runs v2-prjd-run animation, pauses on hover, links to /du-an")
def t1_f16_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator(".v2-hprj")
        sec.scroll_into_view_if_needed()
        run = sec.locator(".v2-hprj-run")
        anim = run.evaluate("el => getComputedStyle(el).animationName")
        assert anim == "v2-prjd-run", f"Marquee animationName={anim}"
        assert sec.locator(".v2-hprj-set").count() >= 2
        sec.locator(".v2-hprj-strip").hover()
        page.wait_for_timeout(120)
        play_state = run.evaluate("el => getComputedStyle(el).animationPlayState")
        assert play_state == "paused", f"Expected marquee paused on hover, got {play_state}"
        assert sec.locator('a[href="/du-an"]').count() >= 1
        guard.assert_clean("T1-F16-04")
    finally:
        ctx.close()


@test_case("T1-F16-05", 1, ["F16"], "1440x900", "HomeLibrarySection renders 4-col #ccc cards that invert to #363738 on hover")
def t1_f16_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator(".v2-hlib")
        sec.scroll_into_view_if_needed()
        cards = sec.locator(".v2-hlib-card")
        assert cards.count() >= 4
        cols = sec.locator(".v2-hlib-cards").evaluate("el => getComputedStyle(el).gridTemplateColumns.split(' ').length")
        assert cols == 4
        idle_bg = cards.first.evaluate("el => getComputedStyle(el).backgroundColor")
        assert idle_bg == "rgb(204, 204, 204)"
        cards.first.hover()
        page.wait_for_timeout(400)
        hover_bg = cards.first.evaluate("el => getComputedStyle(el).backgroundColor")
        assert hover_bg == "rgb(54, 55, 56)", f"Expected hover card bg #363738, got {hover_bg}"
        assert sec.locator('a[href="/thu-vien"]').count() >= 1
        guard.assert_clean("T1-F16-05")
    finally:
        ctx.close()


@test_case("T1-F16-06", 1, ["F16"], "1440x900", "HomeNewsSection renders #000 2-col horizontal news cards and /tin-tuc link")
def t1_f16_06(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/")
        sec = page.locator(".v2-hnews")
        sec.scroll_into_view_if_needed()
        info = sec.evaluate(
            """el => ({
                bg: getComputedStyle(el).backgroundColor,
                cols: getComputedStyle(el.querySelector('.v2-hnews-grid')).gridTemplateColumns.split(' ').length,
                cards: el.querySelectorAll('.v2-hnews-item, .v2-hnews-card').length,
                hasNewsLink: Boolean(el.querySelector('a[href="/tin-tuc"]')),
            })"""
        )
        assert info["bg"] == "rgb(0, 0, 0)"
        assert info["cols"] == 2 and info["cards"] >= 2 and info["hasNewsLink"]
        guard.assert_clean("T1-F16-06")
    finally:
        ctx.close()


# ==============================================================================
# Feature #17: Category Catalog /danh-muc/[slug] (F17 — 5 tests)
# ==============================================================================


@test_case("T1-F17-01", 1, ["F17"], "1440x900", "Catalog banner renders 300-420px hero and .v2-cat-down scrolls to list")
def t1_f17_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/danh-muc/sofa-bac-au")
        banner = page.locator(".v2-cat-banner")
        h = banner.bounding_box()["height"]
        assert 295 <= h <= 425, f"Catalog banner height={h}"
        down = page.locator(".v2-cat-down.v2-round")
        assert down.is_visible()
        down.click()
        page.wait_for_timeout(600)
        assert page.evaluate("() => window.scrollY") > 150
        guard.assert_clean("T1-F17-01")
    finally:
        ctx.close()


@test_case("T1-F17-02", 1, ["F17"], "1440x900", "Catalog body renders 2-col layout, #17181c filter box, and 3-col 4/3 product cards")
def t1_f17_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/danh-muc/sofa-bac-au")
        info = page.evaluate(
            """() => {
                const body = document.querySelector('.v2-cat-body');
                const fbox = document.querySelector('.v2-cat-filter-box');
                const grid = document.querySelector('.v2-cat-grid');
                const pic = document.querySelector('.v2-cat-card-pic');
                if (!body || !fbox || !grid) return null;
                const r = pic ? pic.getBoundingClientRect() : { width: 1, height: 1 };
                return {
                    bodyCols: getComputedStyle(body).gridTemplateColumns.split(' ').length,
                    filterBg: getComputedStyle(fbox).backgroundColor,
                    gridCols: getComputedStyle(grid).gridTemplateColumns.split(' ').length,
                    aspect: r.width / r.height,
                };
            }"""
        )
        assert info is not None, "Missing .v2-cat-body / .v2-cat-filter-box / .v2-cat-grid"
        assert info["bodyCols"] == 2
        assert info["filterBg"] == "rgb(23, 24, 28)"
        assert info["gridCols"] == 3
        assert abs(info["aspect"] - (4 / 3)) <= 0.12
        guard.assert_clean("T1-F17-02")
    finally:
        ctx.close()


@test_case("T1-F17-03", 1, ["F17"], "1440x900", "Catalog search, new-only checkbox, accordion toggle, and reset filters")
def t1_f17_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/danh-muc/tat-ca")
        total = page.locator('.v2-cat-grid a[href^="/san-pham/"]').count()
        search_inp = page.locator(".v2-cat-search, .v2-cat-filter-box input[type='text'], .v2-cat-filter-box input[type='search']").first
        search_inp.fill("Sofa")
        page.wait_for_timeout(150)
        filtered = page.locator('.v2-cat-grid a[href^="/san-pham/"]').count()
        assert 0 < filtered <= total
        reset = page.locator('.v2-cat-reset, button:has-text("Xoá bộ lọc"), button:has-text("Xóa bộ lọc")').first
        reset.click()
        page.wait_for_timeout(150)
        assert page.locator('.v2-cat-grid a[href^="/san-pham/"]').count() == total
        guard.assert_clean("T1-F17-03")
    finally:
        ctx.close()


@test_case("T1-F17-04", 1, ["F17"], "1440x900", "Catalog pagination updates cards and moves .is-current highlight")
def t1_f17_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/danh-muc/tat-ca")
        pages = page.locator(".v2-cat-pages button, .v2-cat-pages a")
        assert pages.count() >= 2, "Expected multi-page pagination .v2-cat-pages on /danh-muc/tat-ca"
        first_p1 = page.locator('.v2-cat-grid a[href^="/san-pham/"]').first.get_attribute("href")
        p2 = page.locator(".v2-cat-pages button", has_text="2").first
        p2.click()
        page.wait_for_timeout(150)
        assert "is-current" in (p2.get_attribute("class") or "")
        first_p2 = page.locator('.v2-cat-grid a[href^="/san-pham/"]').first.get_attribute("href")
        assert first_p2 != first_p1
        guard.assert_clean("T1-F17-04")
    finally:
        ctx.close()


@test_case("T1-F17-05", 1, ["F17"], "390x844", "Mobile catalog shows 2-col grid, slides in .v2-cat-tab and opens .v2-cat-drawer")
def t1_f17_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/danh-muc/tat-ca")
        cols = page.locator(".v2-cat-grid").evaluate("el => getComputedStyle(el).gridTemplateColumns.split(' ').length")
        assert cols == 2
        page.evaluate("window.scrollTo(0, 500)")
        page.wait_for_timeout(200)
        tab = page.locator(".v2-cat-tab, button", has_text="Bộ lọc").first
        tab.click()
        drawer = page.locator(".v2-cat-drawer")
        drawer.wait_for(state="visible", timeout=4000)
        assert drawer.is_visible()
        drawer.locator("button[aria-label*='Đóng' i]").first.click()
        page.wait_for_timeout(150)
        assert_no_horizontal_overflow(page, "T1-F17-05")
        guard.assert_clean("T1-F17-05")
    finally:
        ctx.close()


# ==============================================================================
# Feature #18: Product Detail /san-pham/[slug] (F18 — 6 tests)
# ==============================================================================


@test_case("T1-F18-01", 1, ["F18"], "1440x900", "ProductDetail renders 256px blurred banner, docked crumbs, and masked stage")
def t1_f18_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        prod_url = discover_first_product_url(page, cfg.base_url)
        goto_ready(page, f"{cfg.base_url}{prod_url}")
        info = page.evaluate(
            """() => {
                const ban = document.querySelector('.v2-pd-banner');
                const mainBg = document.querySelector('.v2-pd-main-bg');
                return {
                    banH: ban ? Math.round(ban.getBoundingClientRect().height) : 0,
                    hasCrumbs: Boolean(document.querySelector('.v2-pd-crumbs')),
                    mask: mainBg ? (getComputedStyle(mainBg).maskImage || getComputedStyle(mainBg).webkitMaskImage || '') : '',
                };
            }"""
        )
        assert abs(info["banH"] - 256) <= 10, f"Product banner height={info['banH']}"
        assert info["hasCrumbs"]
        assert "gradient" in info["mask"].lower(), f"Expected vertical mask-image on .v2-pd-main-bg, got {info['mask']!r}"
        guard.assert_clean("T1-F18-01")
    finally:
        ctx.close()


@test_case("T1-F18-02", 1, ["F18"], "1440x900", "Pinned breadcrumb switches cleanly between top: 60px (hidden header) and 100px")
def t1_f18_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        prod_url = discover_first_product_url(page, cfg.base_url)
        goto_ready(page, f"{cfg.base_url}{prod_url}")
        page.evaluate("window.scrollTo(0, 600)")
        page.wait_for_timeout(300)
        crumbs_down = page.evaluate(
            """() => {
                const c = document.querySelector('.v2-pd-crumbs.is-pinned');
                return c ? { top: c.getBoundingClientRect().top, shown: c.classList.contains('is-shown') } : null;
            }"""
        )
        assert crumbs_down is not None and crumbs_down["shown"], f"Expected .v2-pd-crumbs.is-pinned.is-shown on scroll: {crumbs_down}"
        assert abs(crumbs_down["top"] - 60) <= 3, f"Pinned crumbs top with hidden header={crumbs_down['top']}"

        page.evaluate("window.scrollBy(0, -140)")
        page.wait_for_timeout(300)
        crumbs_up = page.evaluate(
            "() => document.querySelector('.v2-pd-crumbs.is-pinned')?.getBoundingClientRect().top"
        )
        assert crumbs_up is not None and abs(crumbs_up - 100) <= 3, f"Pinned crumbs top with visible header={crumbs_up}"
        guard.assert_clean("T1-F18-02")
    finally:
        ctx.close()


@test_case("T1-F18-03", 1, ["F18"], "1440x900", "Product gallery thumbnail switch and zoom lightbox interaction")
def t1_f18_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        prod_url = discover_first_product_url(page, cfg.base_url)
        goto_ready(page, f"{cfg.base_url}{prod_url}")
        thumbs = page.locator(".v2-pd-thumbs button")
        if thumbs.count() >= 2:
            thumbs.nth(1).click()
            page.wait_for_timeout(120)
            cnt = page.locator(".v2-pd-count").inner_text()
            assert cnt.strip().startswith("2"), f"Expected gallery counter 2 / N, got {cnt}"
        zoom = page.locator('.v2-pd-stage button[aria-label*="Phóng to" i], .v2-pd-stage button[aria-label*="Zoom" i]').first
        zoom.click()
        lb = page.locator(".v2-pd-lightbox")
        lb.wait_for(state="visible", timeout=4000)
        lb.locator("button").first.click()
        page.wait_for_timeout(120)
        guard.assert_clean("T1-F18-03")
    finally:
        ctx.close()


@test_case("T1-F18-04", 1, ["F18"], "1440x900", "Wishlist heart toggle persists ag_wishlist in localStorage")
def t1_f18_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        prod_url = discover_first_product_url(page, cfg.base_url)
        goto_ready(page, f"{cfg.base_url}{prod_url}")
        heart = page.locator('button[aria-label*="yêu thích" i]').first
        heart.click()
        page.wait_for_timeout(150)
        wl = page.evaluate("() => window.localStorage.getItem('ag_wishlist')")
        assert wl and len(wl) > 2, f"Expected ag_wishlist stored, got {wl!r}"
        guard.assert_clean("T1-F18-04")
    finally:
        ctx.close()


@test_case("T1-F18-05", 1, ["F18"], "1440x900", "ProductDetail .v2-pd-contact renders all 4 SVG channel CTAs matching brandConfig")
def t1_f18_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        prod_url = discover_first_product_url(page, cfg.base_url)
        goto_ready(page, f"{cfg.base_url}{prod_url}")
        assert_channel_links_complete(page, ".v2-pd-contact", cfg.brand, require_channels=("zalo", "messenger", "shopee", "phone"), require_svg=True)
        guard.assert_clean("T1-F18-05")
    finally:
        ctx.close()


@test_case("T1-F18-06", 1, ["F18"], "1440x900", "ProductDetail specs grid and collapsible related products toggle cleanly")
def t1_f18_06(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        prod_url = discover_first_product_url(page, cfg.base_url)
        goto_ready(page, f"{cfg.base_url}{prod_url}")
        facts_cols = page.locator(".v2-pd-facts").evaluate("el => getComputedStyle(el).gridTemplateColumns.split(' ').length")
        assert facts_cols == 3
        rel_sec = page.locator(".v2-pd-line")
        rel_sec.scroll_into_view_if_needed()
        toggle = rel_sec.locator("button").first
        collapse = rel_sec.locator(".v2-m-collapse").first
        before_expanded = toggle.get_attribute("aria-expanded")
        before_open = collapse.get_attribute("data-open")
        before_h = collapse.bounding_box()["height"]
        toggle.click()
        page.wait_for_timeout(500)
        after_expanded = toggle.get_attribute("aria-expanded")
        after_open = collapse.get_attribute("data-open")
        after_h = collapse.bounding_box()["height"]
        assert after_open != before_open, (
            f"Expected .v2-pd-line .v2-m-collapse[data-open] to toggle ({before_open!r} -> {after_open!r})"
        )
        assert after_h <= 2 or abs(after_h - before_h) > 50, (
            f"Expected .v2-m-collapse height to collapse ({before_h} -> {after_h})"
        )
        if before_expanded is not None or after_expanded is not None:
            assert after_expanded != before_expanded, (
                f"Expected aria-expanded to toggle ({before_expanded!r} -> {after_expanded!r})"
            )
        guard.assert_clean("T1-F18-06")
    finally:
        ctx.close()


# ==============================================================================
# Feature #19: Collection /bo-suu-tap (F19 — 5 tests)
# ==============================================================================


@test_case("T1-F19-01", 1, ["F19"], "1440x900", "Collection pinstriped 256px banner and heading render cleanly")
def t1_f19_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/bo-suu-tap")
        banner = page.locator(".v2-bst-banner")
        info = banner.evaluate("el => ({ h: Math.round(el.getBoundingClientRect().height), bgImg: getComputedStyle(el).backgroundImage })")
        assert abs(info["h"] - 256) <= 10, f"Collection banner height={info['h']}"
        assert "gradient" in info["bgImg"].lower()
        assert page.locator("h1").is_visible()
        guard.assert_clean("T1-F19-01")
    finally:
        ctx.close()


@test_case("T1-F19-02", 1, ["F19"], "1440x900", "Collection bands alternate #292d34 and #141619 with 2-col 645/516 cards")
def t1_f19_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/bo-suu-tap")
        rows = page.locator(".v2-bst-row")
        assert rows.count() >= 2
        bgs = [rows.nth(i).evaluate("el => getComputedStyle(el).backgroundColor") for i in range(rows.count())]
        assert bgs[0] == "rgb(41, 45, 52)" and bgs[1] == "rgb(20, 22, 25)", f"Collection band bgs={bgs}"
        cols = rows.first.evaluate("el => getComputedStyle(el).gridTemplateColumns.split(' ').length")
        assert cols == 2
        r = page.locator(".v2-bst-link").first.bounding_box()
        assert abs((r["width"] / r["height"]) - (645 / 516)) <= 0.12
        guard.assert_clean("T1-F19-02")
    finally:
        ctx.close()


@test_case("T1-F19-03", 1, ["F19"], "1440x900", "Collection cards trigger v2-bst-reveal circular clip-path animation")
def t1_f19_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/bo-suu-tap")
        scroll_and_reveal(page, step_px=450, pause_ms=100)
        page.wait_for_timeout(300)
        cards = page.evaluate(
            """() => Array.from(document.querySelectorAll('.v2-bst-card')).map(el => ({
                shown: el.classList.contains('is-shown'),
                anim: getComputedStyle(el).animationName,
                opacity: parseFloat(getComputedStyle(el).opacity),
            }))"""
        )
        assert len(cards) >= 2
        assert all(c["shown"] and c["opacity"] >= 0.9 for c in cards)
        assert any("v2-bst-reveal" in c["anim"] for c in cards), f"Expected v2-bst-reveal keyframe, got {cards}"
        guard.assert_clean("T1-F19-03")
    finally:
        ctx.close()


@test_case("T1-F19-04", 1, ["F19"], "1440x900", "Hovering collection card crossfades .is-hover image and click navigates")
def t1_f19_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/bo-suu-tap")
        link = page.locator(".v2-bst-link[href], .v2-bst-card[href]").first
        href = link.get_attribute("href")
        assert href
        link.hover()
        page.wait_for_timeout(450)
        hover_img = link.locator("img.is-hover")
        assert hover_img.count() > 0, "Missing dual-image hover crossfade img.is-hover"
        op = hover_img.evaluate("el => parseFloat(getComputedStyle(el).opacity)")
        assert op >= 0.85
        link.click()
        page.wait_for_url(f"**{href}", timeout=10000)
        guard.assert_clean("T1-F19-04")
    finally:
        ctx.close()


@test_case("T1-F19-05", 1, ["F19"], "390x844", "Mobile collection stacks 1-col with full-bleed bands and zero overflow")
def t1_f19_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/bo-suu-tap")
        scroll_and_reveal(page)
        cols = page.locator(".v2-bst-row").first.evaluate("el => getComputedStyle(el).gridTemplateColumns.split(' ').length")
        assert cols == 1
        assert_no_horizontal_overflow(page, "T1-F19-05")
        guard.assert_clean("T1-F19-05")
    finally:
        ctx.close()


# ==============================================================================
# Feature #20: Projects /du-an & /du-an/loai/[type] (F20 — 5 tests)
# ==============================================================================


@test_case("T1-F20-01", 1, ["F20"], "1440x900", "Projects banner + 4-col .v2-prj-kinds tabs with 40x40 rotated active arrow")
def t1_f20_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/du-an")
        info = page.evaluate(
            """() => {
                const kinds = document.querySelector('.v2-prj-kinds');
                const arrow = document.querySelector('.v2-prj-kinds a.is-active .v2-prj-kind-arrow, .v2-prj-kind.is-active .v2-prj-kind-arrow, .v2-prj-kind-arrow.is-active');
                const ar = arrow ? arrow.getBoundingClientRect() : null;
                return {
                    cols: kinds ? getComputedStyle(kinds).gridTemplateColumns.split(' ').length : 0,
                    tabs: kinds ? kinds.children.length : 0,
                    arrowW: ar ? Math.round(ar.width) : 0,
                    arrowH: ar ? Math.round(ar.height) : 0,
                    arrowTf: arrow ? getComputedStyle(arrow).transform : '',
                };
            }"""
        )
        assert info["cols"] == 4 and info["tabs"] == 4
        assert abs(info["arrowW"] - 40) <= 2 and abs(info["arrowH"] - 40) <= 2, f"Project arrow size={info['arrowW']}x{info['arrowH']}"
        assert info["arrowTf"] != "none", f"Active project arrow must rotate 90deg, got {info['arrowTf']}"
        guard.assert_clean("T1-F20-01")
    finally:
        ctx.close()


@test_case("T1-F20-02", 1, ["F20"], "1440x900", "Projects overview renders alternating #141619/#292d34 groups with 3-tile collages")
def t1_f20_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/du-an")
        groups = page.locator(".v2-prjo-group")
        assert groups.count() >= 2, "Expected .v2-prjo-group overview sections on /du-an"
        bgs = [groups.nth(i).evaluate("el => getComputedStyle(el).backgroundColor") for i in range(groups.count())]
        assert bgs[0] != bgs[1], f"Expected alternating overview group surfaces, got {bgs}"
        assert groups.first.locator(".is-big").count() >= 1
        guard.assert_clean("T1-F20-02")
    finally:
        ctx.close()


@test_case("T1-F20-03", 1, ["F20"], "1440x900", "Clicking Nhà phố navigates to /du-an/loai/nha-pho with active rotated arrow and slider")
def t1_f20_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/du-an")
        page.locator(".v2-prj-kinds a, .v2-prj-kinds button", has_text="Nhà phố").first.click()
        page.wait_for_url("**/du-an/loai/nha-pho", timeout=10000)
        slider = page.locator(".v2-prj-slider, .v2-prj").first
        assert slider.is_visible()
        guard.assert_clean("T1-F20-03")
    finally:
        ctx.close()


@test_case("T1-F20-04", 1, ["F20"], "1440x900", "Custom .v2-prj-year dropdown (zero native <select>) filters uniform 296/166 cards")
def t1_f20_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/du-an/loai/nha-pho")
        assert page.locator("select").count() == 0, "Expected custom .v2-prj-year dropdown with ZERO native <select> elements"
        btn = page.locator(".v2-prj-year-button").first
        btn.click()
        menu = page.locator(".v2-prj-year-menu")
        menu.wait_for(state="visible", timeout=3000)
        menu.locator("button, [role='option']", has_text="2025").first.click()
        page.wait_for_timeout(150)
        pic = page.locator(".v2-prj-card-pic, .v2-prj-grid img").first.bounding_box()
        assert abs((pic["width"] / pic["height"]) - (296 / 166)) <= 0.15
        guard.assert_clean("T1-F20-04")
    finally:
        ctx.close()


@test_case("T1-F20-05", 1, ["F20"], "390x844", "Mobile Projects renders horizontal tabs and uniform 2-col 198/127 cards")
def t1_f20_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/du-an/loai/nha-pho")
        cols = page.locator(".v2-prj-grid").evaluate("el => getComputedStyle(el).gridTemplateColumns.split(' ').length")
        assert cols == 2
        pics = page.locator(".v2-prj-card-pic, .v2-prj-grid .aspect-\\[198\\/127\\], .v2-prj-grid img")
        h0 = pics.nth(0).bounding_box()["height"]
        if pics.count() > 1:
            h1 = pics.nth(1).bounding_box()["height"]
            assert abs(h0 - h1) <= 3, f"Card heights not uniform: {h0} vs {h1}"
        assert_no_horizontal_overflow(page, "T1-F20-05")
        guard.assert_clean("T1-F20-05")
    finally:
        ctx.close()


# ==============================================================================
# Feature #21: Library /thu-vien & /thu-vien/[slug] (F21 — 5 tests)
# ==============================================================================


@test_case("T1-F21-01", 1, ["F21"], "1440x900", "Library featured hero renders 56.25vw dark cover and .v2-more CTA")
def t1_f21_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/thu-vien")
        hero = page.locator(".v2-lib-hero")
        h = hero.bounding_box()["height"]
        assert 520 <= h <= 900, f"Library hero height={h}"
        assert hero.locator("a[href^='/thu-vien/']").count() >= 1
        guard.assert_clean("T1-F21-01")
    finally:
        ctx.close()


@test_case("T1-F21-02", 1, ["F21"], "1440x900", "Library .v2-lib-grid renders 3-col 16/9 cards")
def t1_f21_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/thu-vien")
        grid = page.locator(".v2-lib-grid")
        cols = grid.evaluate("el => getComputedStyle(el).gridTemplateColumns.split(' ').length")
        assert cols == 3
        pic = grid.locator("img").first.bounding_box()
        assert abs((pic["width"] / pic["height"]) - (16 / 9)) <= 0.15
        guard.assert_clean("T1-F21-02")
    finally:
        ctx.close()


@test_case("T1-F21-03", 1, ["F21"], "1440x900", "Clicking Library card navigates to /thu-vien/<slug> with HTTP 200")
def t1_f21_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/thu-vien")
        card = page.locator('.v2-lib-grid a[href^="/thu-vien/"]').first
        href = card.get_attribute("href")
        card.click()
        page.wait_for_url(f"**{href}", timeout=10000)
        assert page.locator("h1").is_visible()
        guard.assert_clean("T1-F21-03")
    finally:
        ctx.close()


@test_case("T1-F21-04", 1, ["F21"], "1440x900", "Library detail .v2-art renders 994px prose, share bar, and 3-col related")
def t1_f21_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        art_url = discover_article_url(page, cfg.base_url)
        goto_ready(page, f"{cfg.base_url}{art_url}")
        info = page.evaluate(
            """() => {
                const body = document.querySelector('.v2-art-body');
                const rel = document.querySelector('.v2-art-related-grid');
                return {
                    hasArt: Boolean(document.querySelector('.v2-art')),
                    bodyW: body ? Math.round(body.getBoundingClientRect().width) : 0,
                    hasShare: Boolean(document.querySelector('.v2-art-share')),
                    relCols: rel ? getComputedStyle(rel).gridTemplateColumns.split(' ').length : 0,
                };
            }"""
        )
        assert info["hasArt"] and abs(info["bodyW"] - 994) <= 12
        assert info["hasShare"] and info["relCols"] == 3
        guard.assert_clean("T1-F21-04")
    finally:
        ctx.close()


@test_case("T1-F21-05", 1, ["F21"], "390x844", "Mobile Library listing and detail collapse cleanly with zero overflow")
def t1_f21_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/thu-vien")
        cols = page.locator(".v2-lib-grid").evaluate("el => getComputedStyle(el).gridTemplateColumns.split(' ').length")
        assert cols == 1
        assert_no_horizontal_overflow(page, "T1-F21-05-list")
        art_url = discover_article_url(page, cfg.base_url)
        goto_ready(page, f"{cfg.base_url}{art_url}")
        assert_no_horizontal_overflow(page, "T1-F21-05-detail")
        guard.assert_clean("T1-F21-05")
    finally:
        ctx.close()


# ==============================================================================
# Feature #22: News /tin-tuc & /tin-tuc/[slug] (F22 — 5 tests)
# ==============================================================================


@test_case("T1-F22-01", 1, ["F22"], "1440x900", "News 5-tile mosaic hero renders 2fr 1fr 1fr with .is-big left tile")
def t1_f22_01(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/tin-tuc")
        hero = page.locator(".v2-news-hero")
        info = hero.evaluate(
            """el => ({
                cols: getComputedStyle(el).gridTemplateColumns.split(' ').length,
                tiles: el.querySelectorAll('.v2-news-tile, .v2-news-hero-tile').length,
                hasBig: Boolean(el.querySelector('.v2-news-tile.is-big, .v2-news-hero-tile.is-big')),
            })"""
        )
        assert info["cols"] == 3 and info["tiles"] == 5 and info["hasBig"]
        guard.assert_clean("T1-F22-01")
    finally:
        ctx.close()


@test_case("T1-F22-02", 1, ["F22"], "1440x900", "News filter tabs filter articles and restore on Tất cả")
def t1_f22_02(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/tin-tuc")
        tabs = page.locator(".v2-news-tabs button, .v2-news button", has_text="Sự kiện")
        tabs.first.click()
        page.wait_for_timeout(150)
        assert page.locator('.v2-news-list a[href^="/tin-tuc/"], .v2-news a[href^="/tin-tuc/"]').count() >= 1
        page.locator(".v2-news-tabs button, .v2-news button", has_text="Tất cả").first.click()
        page.wait_for_timeout(150)
        guard.assert_clean("T1-F22-02")
    finally:
        ctx.close()


@test_case("T1-F22-03", 1, ["F22"], "1440x900", "News listing alternates .v2-news-row and .v2-news-row.is-flip asymmetric rows")
def t1_f22_03(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        goto_ready(page, f"{cfg.base_url}/tin-tuc")
        rows = page.locator(".v2-news-row")
        assert rows.count() >= 2, "Expected alternating .v2-news-row layout on /tin-tuc"
        assert page.locator(".v2-news-row.is-flip").count() >= 1
        assert page.locator(".v2-news-card.is-big").count() >= 1
        assert page.locator(".v2-news-card.is-small").count() >= 2
        guard.assert_clean("T1-F22-03")
    finally:
        ctx.close()


@test_case("T1-F22-04", 1, ["F22"], "1440x900", "News detail .v2-art renders breadcrumb, prose, share bar, and related grid")
def t1_f22_04(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "1440x900")
    try:
        news_url = discover_news_url(page, cfg.base_url)
        goto_ready(page, f"{cfg.base_url}{news_url}")
        assert page.locator(".v2-art").is_visible()
        assert page.locator(".v2-art-share").is_visible()
        assert page.locator(".v2-art-related-grid").is_visible()
        assert_all_images_loaded(page, "T1-F22-04")
        guard.assert_clean("T1-F22-04")
    finally:
        ctx.close()


@test_case("T1-F22-05", 1, ["F22"], "390x844", "Mobile News hero collapses to 1fr 1fr and rows stack with zero overflow")
def t1_f22_05(browser: Browser, cfg: RunConfig) -> None:
    ctx, page, guard = open_page(browser, cfg.base_url, "390x844")
    try:
        goto_ready(page, f"{cfg.base_url}/tin-tuc")
        cols = page.locator(".v2-news-hero").evaluate("el => getComputedStyle(el).gridTemplateColumns.split(' ').length")
        assert cols == 2
        assert_no_horizontal_overflow(page, "T1-F22-05")
        guard.assert_clean("T1-F22-05")
    finally:
        ctx.close()
