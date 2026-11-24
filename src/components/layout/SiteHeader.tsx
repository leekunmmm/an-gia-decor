"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Heart, LogOut, Search, User, X } from "lucide-react";
import {
  categories as defaultCategories,
  productGroups,
  type ProductCategory,
} from "@/data/categories";
import { useUI } from "@/context/UIContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { BrandLogo } from "./BrandLogo";
import { ChannelAnchor, getChannelItems, PhoneIcon } from "./ChannelIcons";

function RollLabel({ text }: { text: string }) {
  return (
    <span className="v2-roll">
      <span>{text}</span>
      <span aria-hidden="true">{text}</span>
    </span>
  );
}

export function SiteHeader({
  categories = defaultCategories,
}: {
  categories?: ProductCategory[];
}) {
  const pathname = usePathname();
  const brandConfig = useSiteSettings();
  const {
    megaOpen,
    setMegaOpen,
    mobileMenuOpen,
    setMobileMenuOpen,
    searchOpen,
    setSearchOpen,
    authOpen,
    setAuthOpen,
    user,
    signOut,
    wishlist,
    showToast,
  } = useUI();

  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [mobileOpenGroupId, setMobileOpenGroupId] = useState<string | null>(
    productGroups[0]?.id ?? null
  );
  const lastYRef = useRef(0);
  const desktopAccountWrapRef = useRef<HTMLDivElement>(null);
  const mobileAccountWrapRef = useRef<HTMLDivElement>(null);

  const topChannels = getChannelItems(["zalo", "messenger", "shopee"], brandConfig);
  const drawerChannels = getChannelItems(["messenger", "zalo", "shopee", "hotline"], brandConfig);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      setScrolled(y > 32);
      if (megaOpen || searchOpen || authOpen || mobileMenuOpen) {
        setHidden(false);
        lastYRef.current = y;
        return;
      }
      if (y > 260 && y > lastYRef.current + 6) {
        setHidden(true);
      } else if (y < lastYRef.current - 6 || y <= 140) {
        setHidden(false);
      }
      lastYRef.current = y;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [megaOpen, searchOpen, authOpen, mobileMenuOpen]);

  useEffect(() => {
    if (!accountMenuOpen) return;
    const onOutside = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      const inDesktop = desktopAccountWrapRef.current?.contains(target) ?? false;
      const inMobile = mobileAccountWrapRef.current?.contains(target) ?? false;
      if (!inDesktop && !inMobile) {
        setAccountMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", onOutside);
    return () => window.removeEventListener("mousedown", onOutside);
  }, [accountMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      const t = setTimeout(() => setMobileProductsOpen(false), 0);
      return () => clearTimeout(t);
    }
  }, [mobileMenuOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const handleAccountClick = () => {
    if (user) {
      setAccountMenuOpen((v) => !v);
    } else {
      setAuthOpen(true);
    }
  };

  const renderAccountBlock = (isDesktopTop: boolean) => (
    <div
      ref={isDesktopTop ? desktopAccountWrapRef : mobileAccountWrapRef}
      className="v2-drop-wrap v2-account"
    >
      <button
        type="button"
        onClick={handleAccountClick}
        aria-label={user ? `Tài khoản: ${user.name}` : "Đăng nhập"}
        aria-expanded={user ? accountMenuOpen : authOpen}
        className={`v2-account-button ${accountMenuOpen ? "is-open" : ""}`}
      >
        <span className="v2-account-icon">
          <User className="w-[20px] h-[20px]" strokeWidth={2} />
          {user && (
            <span
              className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-[#e2ad21]"
              aria-hidden="true"
            />
          )}
        </span>
        {user && <span className="v2-account-name">{user.name}</span>}
      </button>

      {user && accountMenuOpen && (
        <div className="v2-account-menu" role="dialog" aria-label="Menu tài khoản">
          <button
            type="button"
            onClick={() => setAccountMenuOpen(false)}
            aria-label="Đóng menu tài khoản"
            className="v2-account-close v2-round"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="pb-3 pr-10 border-b border-white/15">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#e2ad21]">
              Thành viên {brandConfig.name}
            </p>
            <p className="text-base font-bold text-white mt-1 truncate">{user.name}</p>
            <p className="text-xs text-[#9c9c9c] truncate">{user.email}</p>
          </div>
          <Link
            href="/danh-muc/tat-ca"
            onClick={() => {
              setAccountMenuOpen(false);
              showToast(`Bạn đã lưu ${wishlist.length} sản phẩm yêu thích`);
            }}
            className="v2-account-row"
          >
            <Heart className="w-4 h-4 text-[#e2ad21] shrink-0" />
            <RollLabel text={`Yêu thích (${wishlist.length})`} />
          </Link>
          <button
            type="button"
            onClick={() => {
              setAccountMenuOpen(false);
              setAuthOpen(true);
            }}
            className="v2-account-row"
          >
            <User className="w-4 h-4 text-[#e2ad21] shrink-0" />
            <RollLabel text="Thông tin tài khoản" />
          </button>
          <button
            type="button"
            onClick={() => {
              setAccountMenuOpen(false);
              void signOut();
            }}
            className="v2-account-row is-logout"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <RollLabel text="Đăng xuất" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div
        className={`v2-header ${scrolled ? "is-scrolled" : ""} ${
          hidden ? "is-hidden" : ""
        } ${megaOpen ? "is-mega" : ""} ${mobileMenuOpen ? "is-menu" : ""}`}
      >
        {/* Top Utility Bar (Desktop >= 1100px) */}
        <div className="v2-header-top">
          <div className="v2-header-top-side">
            <a href={`tel:${brandConfig.hotlineRaw}`}>
              <PhoneIcon size={14} />
              <span>Hotline {brandConfig.hotline}</span>
            </a>
            <a href={`mailto:${brandConfig.email}`}>{brandConfig.email}</a>
          </div>

          <div className="v2-header-top-side is-end">
            {topChannels.map((ch) => (
              <ChannelAnchor key={ch.key} channel={ch}>
                {ch.renderIcon({ size: 15 })}
                <span>{ch.shortLabel}</span>
              </ChannelAnchor>
            ))}

            <div className="v2-header-top-tools" data-header-actions="true">
              <button
                type="button"
                className="v2-icon"
                onClick={() => setSearchOpen(true)}
                aria-label="Tìm kiếm sản phẩm"
                aria-haspopup="dialog"
                aria-expanded={searchOpen}
              >
                <Search className="w-[19px] h-[19px]" strokeWidth={2} />
              </button>
              {renderAccountBlock(true)}
            </div>
          </div>
        </div>

        {/* Main 3-Column Navigation Bar */}
        <header className="v2-header-bar">
          <div className="v2-header-side">
            <nav className="v2-nav" aria-label="Menu chính">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setMegaOpen(!megaOpen);
                }}
                className={`v2-nav-link ${megaOpen ? "is-active" : ""}`}
                aria-haspopup="dialog"
                aria-expanded={megaOpen}
                aria-controls="v2-products-menu"
              >
                <RollLabel text="Sản phẩm" />
              </button>
              <Link href="/#rooms" className="v2-nav-link">
                <RollLabel text="Phòng" />
              </Link>
              <Link
                href="/bo-suu-tap"
                className={`v2-nav-link ${isActive("/bo-suu-tap") ? "is-active" : ""}`}
              >
                <RollLabel text="Bộ sưu tập" />
              </Link>
              <Link
                href="/du-an"
                className={`v2-nav-link ${isActive("/du-an") ? "is-active" : ""}`}
              >
                <RollLabel text="Dự án" />
              </Link>
            </nav>
          </div>

          <Link
            href="/"
            onClick={() => {
              setMobileMenuOpen(false);
              setMegaOpen(false);
            }}
            aria-label={`${brandConfig.name}, trang chủ`}
            className="v2-logo"
          >
            <BrandLogo size={scrolled || megaOpen ? "sm" : "md"} />
          </Link>

          <div className="v2-header-side is-end">
            <nav className="v2-nav is-right" aria-label="Liên kết">
              <Link
                href="/tin-tuc"
                className={`v2-nav-link ${isActive("/tin-tuc") ? "is-active" : ""}`}
              >
                <RollLabel text="Tin tức" />
              </Link>
              <Link
                href="/thu-vien"
                className={`v2-nav-link ${isActive("/thu-vien") ? "is-active" : ""}`}
              >
                <RollLabel text="Thư viện" />
              </Link>
              <Link href="/#footer" className="v2-nav-link">
                <RollLabel text="Showroom" />
              </Link>
              <Link href="/#footer" className="v2-nav-link">
                <RollLabel text="Liên hệ" />
              </Link>
            </nav>

            {/* Mobile controls (< 1100px) */}
            <div className="flex min-[1100px]:hidden items-center gap-0.5">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSearchOpen(true);
                }}
                aria-label="Tìm kiếm sản phẩm"
                aria-haspopup="dialog"
                aria-expanded={searchOpen}
                className="v2-icon"
              >
                <Search className="w-[19px] h-[19px]" strokeWidth={2} />
              </button>
              {renderAccountBlock(false)}
              <button
                type="button"
                onClick={() => {
                  setMegaOpen(false);
                  setMobileMenuOpen((v) => !v);
                }}
                aria-label={mobileMenuOpen ? "Đóng menu" : "Mở menu"}
                aria-expanded={mobileMenuOpen}
                aria-controls="v2-mobile-menu"
                className={`v2-icon v2-burger ${mobileMenuOpen ? "is-open" : ""}`}
              >
                <span />
                <span />
                <span />
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          id="v2-mobile-menu"
          className="v2-mobile-menu min-[1100px]:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu di động"
          data-lenis-prevent
        >
          <ul className="v2-m-list">
            <li
              className={mobileProductsOpen ? "is-open" : ""}
              style={{ "--i": 0 } as React.CSSProperties}
            >
              <button
                type="button"
                onClick={() => setMobileProductsOpen((v) => !v)}
                aria-expanded={mobileProductsOpen}
                className="v2-m-row"
              >
                <span>Sản phẩm ({categories.length} danh mục)</span>
                <ChevronDown className="w-5 h-5" />
              </button>

              <div className="v2-m-collapse" data-open={mobileProductsOpen ? "true" : "false"}>
                <div>
                  <ul className="v2-m-rooms">
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setMegaOpen(true);
                        }}
                        className="v2-m-room text-[#e2ad21] font-semibold"
                      >
                        <span>Mở danh mục nhanh ({categories.length})</span>
                        <span>→</span>
                      </button>
                    </li>
                    {productGroups.map((group) => {
                      const groupCats = categories.filter((c) => c.groupId === group.id);
                      const isGroupOpen = mobileOpenGroupId === group.id;
                      return (
                        <li key={group.id} className={isGroupOpen ? "is-open" : ""}>
                          <button
                            type="button"
                            onClick={() =>
                              setMobileOpenGroupId(isGroupOpen ? null : group.id)
                            }
                            aria-expanded={isGroupOpen}
                            className="v2-m-room"
                          >
                            <span>
                              {group.name} ({groupCats.length})
                            </span>
                            <ChevronDown className="w-4 h-4" />
                          </button>

                          <div
                            className="v2-m-collapse"
                            data-open={isGroupOpen ? "true" : "false"}
                          >
                            <div>
                              <div className="v2-m-cards">
                                {groupCats.map((cat) => (
                                  <Link
                                    key={cat.slug}
                                    href={`/danh-muc/${cat.slug}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="v2-m-card"
                                  >
                                    <img
                                      src={cat.previewImage}
                                      alt={cat.title}
                                      loading="lazy"
                                    />
                                    <span className="v2-m-card-title">{cat.title}</span>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </li>

            <li style={{ "--i": 1 } as React.CSSProperties}>
              <Link
                href="/danh-muc/tat-ca"
                onClick={() => setMobileMenuOpen(false)}
                className="v2-m-row"
              >
                <span>Catalogue đầy đủ</span>
              </Link>
            </li>
            <li style={{ "--i": 2 } as React.CSSProperties}>
              <Link
                href="/#rooms"
                onClick={() => setMobileMenuOpen(false)}
                className="v2-m-row"
              >
                <span>Ứng dụng theo phòng</span>
              </Link>
            </li>
            <li style={{ "--i": 3 } as React.CSSProperties}>
              <Link
                href="/bo-suu-tap"
                onClick={() => setMobileMenuOpen(false)}
                className="v2-m-row"
              >
                <span>Bộ sưu tập</span>
              </Link>
            </li>
            <li style={{ "--i": 4 } as React.CSSProperties}>
              <Link
                href="/du-an"
                onClick={() => setMobileMenuOpen(false)}
                className="v2-m-row"
              >
                <span>Dự án thực tế</span>
              </Link>
            </li>
            <li style={{ "--i": 5 } as React.CSSProperties}>
              <Link
                href="/thu-vien"
                onClick={() => setMobileMenuOpen(false)}
                className="v2-m-row"
              >
                <span>Thư viện kiến thức</span>
              </Link>
            </li>
            <li style={{ "--i": 6 } as React.CSSProperties}>
              <Link
                href="/tin-tuc"
                onClick={() => setMobileMenuOpen(false)}
                className="v2-m-row"
              >
                <span>Tin tức &amp; Sự kiện</span>
              </Link>
            </li>
            <li style={{ "--i": 7 } as React.CSSProperties}>
              <Link
                href="/#footer"
                onClick={() => setMobileMenuOpen(false)}
                className="v2-m-row text-[#e2ad21]"
              >
                <span>Showroom &amp; Liên hệ tư vấn</span>
              </Link>
            </li>
          </ul>

          <div className="v2-m-phone space-y-4">
            <div className="space-y-1 text-xs text-[#9c9c9c]">
              <a
                href={`tel:${brandConfig.hotlineRaw}`}
                className="inline-flex items-center gap-2 text-sm font-bold text-[#e2ad21]"
              >
                <PhoneIcon size={15} />
                <span>Hotline: {brandConfig.hotline}</span>
              </a>
              <p>{brandConfig.address}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {drawerChannels.map((ch) => (
                <ChannelAnchor
                  key={ch.key}
                  channel={ch}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-white/15 bg-white/5 text-xs font-semibold text-white hover:border-[#e2ad21]"
                >
                  {ch.renderIcon({ size: 16 })}
                  <span>{ch.key === "hotline" ? "Hotline" : ch.shortLabel}</span>
                </ChannelAnchor>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
