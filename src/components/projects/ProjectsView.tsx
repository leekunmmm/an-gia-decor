"use client";

import "@/styles/pages/projects.css";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Home,
  X,
} from "lucide-react";
import {
  projects as defaultProjects,
  projectTypeStats,
  type ProjectItem,
} from "@/data/projects";
import { products as defaultProducts, type Product } from "@/data/products";
import { useSiteSettings } from "@/context/SiteSettingsContext";

interface ProjectsViewProps {
  initialType?: string;
  projects?: ProjectItem[];
}

const typeTabs = [
  { id: "tat-ca", label: "Tất cả", href: "/du-an" },
  { id: "nha-pho", label: "Nhà phố", href: "/du-an/loai/nha-pho" },
  { id: "van-phong", label: "Văn phòng", href: "/du-an/loai/van-phong" },
  { id: "cua-hang", label: "Cửa hàng", href: "/du-an/loai/cua-hang" },
];

const ITEMS_PER_PAGE = 3;

function getScrollBehavior(): ScrollBehavior {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return "auto";
  }
  return "smooth";
}

function MoreIcon() {
  return (
    <span className="v2-bst-more-icon v2-more-icon" aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <g className="v2-more-arrow is-out">
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </g>
        <g className="v2-more-arrow is-in">
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </g>
      </svg>
    </span>
  );
}

function SplitChars({ text }: { text: string }) {
  const words = text.split(" ");
  let charCounter = 0;

  return (
    <>
      {words.map((word, wIdx) => {
        const chars = Array.from(word);
        return (
          <React.Fragment key={`${word}-${wIdx}`}>
            <span className="v2-split-word">
              {chars.map((ch, cIdx) => {
                const idx = charCounter++;
                return (
                  <span
                    key={`${ch}-${wIdx}-${cIdx}`}
                    className="v2-split-char"
                    style={{ "--char-index": idx } as React.CSSProperties}
                  >
                    {ch}
                  </span>
                );
              })}
            </span>
            {wIdx < words.length - 1 ? " " : null}
          </React.Fragment>
        );
      })}
    </>
  );
}

function CountUp({ target }: { target: number }) {
  const [val, setVal] = useState(target);
  const ref = useRef<HTMLSpanElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      return;
    }

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      startedRef.current = true;
      return;
    }

    let rafId = 0;
    const runAnimation = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      const start = performance.now();
      const duration = 650;
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setVal(Math.round(target * (0.25 + 0.75 * eased)));
        if (progress < 1) {
          rafId = requestAnimationFrame(tick);
        }
      };
      rafId = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          runAnimation();
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [target]);

  return <span ref={ref}>{val}</span>;
}

function getCircularOffset(idx: number, activeIdx: number, total: number): number {
  if (total <= 1) return 0;
  let diff = idx - activeIdx;
  if (diff > total / 2) diff -= total;
  if (diff < -total / 2) diff += total;
  return diff;
}

function OverviewGroup({
  stat,
  items,
  altBg,
}: {
  stat: (typeof projectTypeStats)[number];
  items: ProjectItem[];
  altBg: boolean;
}) {
  const [slideIdx, setSlideIdx] = useState(0);

  const slides = useMemo(() => {
    const out: ProjectItem[][] = [];
    for (let i = 0; i < items.length; i += 3) {
      const chunk = items.slice(i, i + 3);
      let k = 0;
      while (chunk.length < 3 && items.length >= 3) {
        chunk.push(items[k % items.length]);
        k += 1;
      }
      out.push(chunk);
    }
    return out;
  }, [items]);

  const totalSlides = slides.length;
  const safeSlide = Math.min(slideIdx, Math.max(0, totalSlides - 1));

  const goPrev = () =>
    setSlideIdx((prev) => (prev - 1 + totalSlides) % totalSlides);
  const goNext = () => setSlideIdx((prev) => (prev + 1) % totalSlides);

  return (
    <section
      className={`v2-prjo-group ${altBg ? "is-alt" : ""}`}
      aria-label={`Dự án ${stat.label}`}
    >
      <div className="v2-prjo-wrap">
        <div className="v2-prjo-head">
          <h2 className="v2-reveal">
            <span>{stat.label}</span>
            <span
              className="v2-prjo-count"
              aria-label={`${stat.count} dự án`}
            >
              <CountUp target={stat.count} />
            </span>
          </h2>

          <div className="v2-prjo-tools">
            <Link
              href={`/du-an/loai/${stat.type}`}
              className="v2-prjo-all v2-more"
            >
              <span className="v2-more-label">Xem Tất Cả</span>
              <MoreIcon />
            </Link>

            {totalSlides > 1 && (
              <div className="v2-prjo-steps is-head">
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label={`Xem nhóm ${stat.label} trước`}
                  className="v2-round"
                >
                  <ArrowLeft width={18} height={18} strokeWidth={2} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label={`Xem nhóm ${stat.label} tiếp`}
                  className="v2-round"
                >
                  <ArrowRight width={18} height={18} strokeWidth={2} aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="v2-prjo-slider">
          <div
            className="v2-prjo-track"
            style={{ transform: `translateX(-${safeSlide * 100}%)` }}
          >
            {slides.map((group, gIdx) => (
              <div key={`${stat.type}-slide-${gIdx}`} className="v2-prjo-slide">
                {group.map((prj, tIdx) => (
                  <Link
                    key={`${stat.type}-${gIdx}-${prj.slug}-${tIdx}`}
                    href={`/du-an/${prj.slug}`}
                    className={`v2-prjo-thumb ${tIdx === 0 ? "is-big" : ""}`}
                  >
                    <img src={prj.coverImage} alt={prj.title} />
                    <span className="v2-prjo-thumb-copy">
                      <span className="v2-prjo-thumb-name">{prj.title}</span>
                      <span className="v2-prjo-thumb-info">
                        <span className="v2-prjo-thumb-line">
                          {prj.location} · {prj.area}
                        </span>
                        <span className="v2-prjo-thumb-year">{prj.year}</span>
                      </span>
                      <span className="v2-prjo-thumb-more v2-more">
                        <span className="v2-more-label">Chi Tiết</span>
                        <MoreIcon />
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            ))}
          </div>

          {totalSlides > 1 && (
            <div className="v2-prjo-steps is-over">
              <button
                type="button"
                onClick={goPrev}
                aria-label={`Xem nhóm ${stat.label} trước`}
                className="v2-round"
              >
                <ArrowLeft width={18} height={18} strokeWidth={2} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label={`Xem nhóm ${stat.label} tiếp`}
                className="v2-round"
              >
                <ArrowRight width={18} height={18} strokeWidth={2} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function ProjectsView({
  initialType = "tat-ca",
  projects = defaultProjects,
}: ProjectsViewProps) {
  const brandConfig = useSiteSettings();
  const isOverview = initialType === "tat-ca";
  const activeStat = projectTypeStats.find((s) => s.type === initialType);
  const bannerImage = activeStat?.image || "/images/project-villa.jpg";
  const bannerTitle = activeStat ? activeStat.label : "Dự án hoàn thiện";
  const bannerEyebrow = activeStat ? "Dự án" : "Hồ sơ công trình";

  const [prevType, setPrevType] = useState(initialType);
  const [selectedYear, setSelectedYear] = useState("all");
  const [yearMenuOpen, setYearMenuOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [slideIdx, setSlideIdx] = useState(0);

  if (prevType !== initialType) {
    setPrevType(initialType);
    setSelectedYear("all");
    setYearMenuOpen(false);
    setPage(1);
    setSlideIdx(0);
  }

  const kindsRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLElement>(null);
  const yearWrapRef = useRef<HTMLDivElement>(null);
  const yearBtnRef = useRef<HTMLButtonElement>(null);
  const yearMenuRef = useRef<HTMLUListElement>(null);
  const yearMenuFocusTargetRef = useRef<"selected" | "first" | "last" | null>(
    null
  );

  const typeProjects = useMemo(
    () =>
      initialType === "tat-ca"
        ? projects
        : projects.filter((p) => p.type === initialType),
    [initialType, projects]
  );

  const liveStats = useMemo(
    () =>
      projectTypeStats.map((stat) => {
        const typeItems = projects.filter((p) => p.type === stat.type);
        return {
          ...stat,
          count: typeItems.length,
          items: typeItems,
        };
      }),
    [projects]
  );

  const sliderProjects = useMemo(() => {
    const featuredFirst = [
      ...typeProjects.filter((p) => p.featured),
      ...typeProjects.filter((p) => !p.featured),
    ];
    return featuredFirst.slice(0, 3);
  }, [typeProjects]);

  const availableYears = useMemo(() => {
    const set = new Set(typeProjects.map((p) => p.year));
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [typeProjects]);

  const yearOptions = useMemo(
    () => [
      { value: "all", label: "Tất Cả Các Năm" },
      ...availableYears.map((y) => ({ value: y, label: y })),
    ],
    [availableYears]
  );

  const filtered = useMemo(() => {
    if (selectedYear === "all") return typeProjects;
    return typeProjects.filter((p) => p.year === selectedYear);
  }, [typeProjects, selectedYear]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  const focusYearMenuOption = (mode: "selected" | "first" | "last") => {
    const buttons = Array.from(
      yearMenuRef.current?.querySelectorAll<HTMLButtonElement>(
        ".v2-prj-year-option"
      ) ?? []
    );
    if (buttons.length === 0) return;
    if (mode === "last") {
      buttons[buttons.length - 1].focus();
      return;
    }
    if (mode === "selected") {
      const selectedBtn = buttons.find(
        (btn) => btn.getAttribute("aria-selected") === "true"
      );
      (selectedBtn ?? buttons[0]).focus();
      return;
    }
    buttons[0].focus();
  };

  useEffect(() => {
    if (!yearMenuOpen) return;
    const focusTarget = yearMenuFocusTargetRef.current;
    if (focusTarget) {
      yearMenuFocusTargetRef.current = null;
      focusYearMenuOption(focusTarget);
    }
    const handleOutside = (e: MouseEvent) => {
      if (
        yearWrapRef.current &&
        e.target instanceof Node &&
        !yearWrapRef.current.contains(e.target)
      ) {
        setYearMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setYearMenuOpen(false);
        yearBtnRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [yearMenuOpen]);

  const handleSelectYear = (value: string) => {
    setSelectedYear(value);
    setPage(1);
    setYearMenuOpen(false);
    yearBtnRef.current?.focus();
  };

  const handleYearButtonKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>
  ) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!yearMenuOpen) {
        yearMenuFocusTargetRef.current = "selected";
        setYearMenuOpen(true);
      } else {
        focusYearMenuOption("selected");
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!yearMenuOpen) {
        yearMenuFocusTargetRef.current = "last";
        setYearMenuOpen(true);
      } else {
        focusYearMenuOption("last");
      }
    } else if ((e.key === "Enter" || e.key === " ") && !yearMenuOpen) {
      yearMenuFocusTargetRef.current = "selected";
    }
  };

  const handleYearBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!yearMenuOpen) return;
    const related = e.relatedTarget as Node | null;
    if (!related || !yearWrapRef.current?.contains(related)) {
      setYearMenuOpen(false);
    }
  };

  const handleYearMenuKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    const buttons = Array.from(
      yearMenuRef.current?.querySelectorAll<HTMLButtonElement>(
        ".v2-prj-year-option"
      ) ?? []
    );
    if (buttons.length === 0) return;
    const currentIdx = buttons.findIndex(
      (btn) => btn === document.activeElement
    );
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = buttons[(currentIdx + 1) % buttons.length];
      next.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = buttons[(currentIdx - 1 + buttons.length) % buttons.length];
      prev.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      buttons[0].focus();
    } else if (e.key === "End") {
      e.preventDefault();
      buttons[buttons.length - 1].focus();
    }
  };

  const handlePageChange = (nextPage: number) => {
    const clamped = Math.max(1, Math.min(totalPages, nextPage));
    setPage(clamped);
    listRef.current?.scrollIntoView({
      behavior: getScrollBehavior(),
      block: "start",
    });
  };

  const handleBannerDown = () => {
    kindsRef.current?.scrollIntoView({
      behavior: getScrollBehavior(),
      block: "start",
    });
  };

  const totalSlider = sliderProjects.length;
  const safeSlideIdx = Math.min(slideIdx, Math.max(0, totalSlider - 1));

  return (
    <div className="v2-prj">
      {/* Shared Hero Banner */}
      <section className="v2-cat-banner v2-prj-banner">
        <div className="v2-cat-banner-media">
          <img src={bannerImage} alt={`${bannerTitle} — ${brandConfig.name}`} />
        </div>
        <div className="v2-wrap v2-cat-banner-copy">
          <p className="v2-prj-eyebrow">{bannerEyebrow}</p>
          <h1 className="v2-split is-chars is-alternate v2-cat-banner-title v2-prj-title">
            <SplitChars text={bannerTitle} />
          </h1>
        </div>
        <button
          type="button"
          className="v2-cat-down v2-round"
          aria-label="Xem dự án"
          onClick={handleBannerDown}
        >
          <ArrowDown width={16} height={16} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </section>

      {/* 4-Column Type Navigation Tabs */}
      <nav
        ref={kindsRef}
        className="v2-prj-kinds"
        aria-label="Phân loại dự án"
      >
        {typeTabs.map((tab) => {
          const active = initialType === tab.id;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={active ? "is-active" : undefined}
              aria-current={active ? "page" : undefined}
            >
              <span className="v2-roll">
                <span>{tab.label}</span>
                <span aria-hidden="true">{tab.label}</span>
              </span>
              <span className="v2-prj-kind-arrow" aria-hidden="true">
                <ArrowRight width={14} height={14} strokeWidth={2} />
              </span>
            </Link>
          );
        })}
      </nav>

      {isOverview ? (
        /* Overview (/du-an): Alternating 3-Tile Collage Sections */
        <div>
          {liveStats.map((stat, idx) => (
            <OverviewGroup
              key={stat.type}
              stat={stat}
              items={stat.items}
              altBg={idx % 2 === 1}
            />
          ))}
        </div>
      ) : (
        /* Type Listing (/du-an/loai/[type]) */
        <>
          {/* Featured 65vw 3D-Offset Carousel */}
          <section className="v2-prj-featured" aria-label="Dự án tiêu biểu">
            <h2 className="v2-prj-heading v2-reveal">Dự án tiêu biểu</h2>

            <div className="v2-prj-slider">
              {sliderProjects.map((slide, idx) => {
                const offset = getCircularOffset(idx, safeSlideIdx, totalSlider);
                const abs = Math.abs(offset);
                const isCurrent = offset === 0;
                const isSide = !isCurrent && abs <= 1;

                return (
                  <article
                    key={slide.slug}
                    className={`v2-prj-slide ${isCurrent ? "is-current" : ""} ${
                      isSide ? "is-side" : ""
                    }`}
                    style={
                      {
                        "--offset": offset,
                        "--abs": abs,
                      } as React.CSSProperties
                    }
                    onClick={isSide ? () => setSlideIdx(idx) : undefined}
                  >
                    <img src={slide.coverImage} alt={slide.title} />
                    <div className="v2-prj-slide-copy">
                      <div className="v2-prj-slide-meta">
                        <h3 className="v2-prj-slide-name">{slide.title}</h3>
                        <p className="v2-prj-slide-line">
                          {slide.location} · {slide.area} · {slide.year}
                        </p>
                      </div>
                      <Link
                        href={`/du-an/${slide.slug}`}
                        className="v2-prj-slide-more v2-more"
                        tabIndex={isCurrent ? 0 : -1}
                      >
                        <span className="v2-more-label">Chi Tiết</span>
                        <MoreIcon />
                      </Link>
                    </div>
                  </article>
                );
              })}

              {totalSlider > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setSlideIdx((prev) => (prev - 1 + totalSlider) % totalSlider)
                    }
                    aria-label="Dự án tiêu biểu trước"
                    className="v2-prj-step is-prev v2-round"
                  >
                    <ArrowLeft width={18} height={18} strokeWidth={2} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSlideIdx((prev) => (prev + 1) % totalSlider)
                    }
                    aria-label="Dự án tiêu biểu tiếp"
                    className="v2-prj-step is-next v2-round"
                  >
                    <ArrowRight width={18} height={18} strokeWidth={2} aria-hidden="true" />
                  </button>
                </>
              )}
            </div>

            {totalSlider > 1 && (
              <div className="v2-prj-dots" role="tablist" aria-label="Chọn dự án tiêu biểu">
                {sliderProjects.map((slide, idx) => (
                  <button
                    key={`dot-${slide.slug}`}
                    type="button"
                    role="tab"
                    aria-selected={idx === safeSlideIdx}
                    aria-label={`Xem ${slide.title}`}
                    onClick={() => setSlideIdx(idx)}
                    className={`v2-prj-dot ${
                      idx === safeSlideIdx ? "is-active" : ""
                    }`}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Filterable Uniform Project Grid */}
          <section
            ref={listRef}
            className="v2-prj-list"
            aria-label={`Danh sách dự án ${bannerTitle}`}
          >
            <div className="v2-prj-list-head">
              <h2 className="v2-prj-heading v2-reveal">
                Tất cả dự án {bannerTitle}
              </h2>

              <div
                ref={yearWrapRef}
                className="v2-prj-year"
                onBlur={handleYearBlur}
              >
                <button
                  ref={yearBtnRef}
                  type="button"
                  className="v2-prj-year-button"
                  aria-haspopup="listbox"
                  aria-expanded={yearMenuOpen}
                  onClick={(e) => {
                    if (!yearMenuOpen && e.detail === 0) {
                      yearMenuFocusTargetRef.current = "selected";
                    }
                    setYearMenuOpen((v) => !v);
                  }}
                  onKeyDown={handleYearButtonKeyDown}
                >
                  <span>
                    {selectedYear === "all" ? "Chọn Theo Năm" : selectedYear}
                  </span>
                  <ChevronDown
                    width={16}
                    height={16}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </button>

                {yearMenuOpen && (
                  <ul
                    ref={yearMenuRef}
                    className="v2-prj-year-menu"
                    role="listbox"
                    aria-label="Chọn năm bàn giao"
                    onMouseDown={(e) => {
                      if (e.target === e.currentTarget) e.preventDefault();
                    }}
                    onKeyDown={handleYearMenuKeyDown}
                  >
                    {yearOptions.map((opt) => (
                      <li key={opt.value} role="none">
                        <button
                          type="button"
                          role="option"
                          className="v2-prj-year-option"
                          aria-selected={selectedYear === opt.value}
                          onClick={() => handleSelectYear(opt.value)}
                        >
                          {opt.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {paginated.length > 0 ? (
              <div className="v2-prj-grid">
                {paginated.map((prj, idx) => (
                  <Link
                    key={`${initialType}-${selectedYear}-${safePage}-${prj.slug}`}
                    href={`/du-an/${prj.slug}`}
                    className="v2-prj-card v2-reveal"
                    style={{ "--order": idx } as React.CSSProperties}
                  >
                    <div className="v2-prj-card-pic">
                      <img src={prj.coverImage} alt={prj.title} />
                    </div>
                    <h3 className="v2-prj-card-name">{prj.title}</h3>
                    <span className="v2-prj-card-line">
                      {prj.location} · {prj.area} · {prj.year}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="v2-cat-empty">
                Không tìm thấy dự án phù hợp trong năm đã chọn.
              </p>
            )}

            {totalPages > 1 && (
              <div className="v2-prj-pages" aria-label="Phân trang dự án">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => handlePageChange(safePage - 1)}
                  aria-label="Trang trước"
                  className="v2-prj-page"
                >
                  <ChevronLeft width={20} height={20} strokeWidth={2} aria-hidden="true" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (num) => (
                    <button
                      key={`page-${num}`}
                      type="button"
                      onClick={() => handlePageChange(num)}
                      aria-label={`Trang ${num}`}
                      aria-current={num === safePage ? "page" : undefined}
                      className={`v2-prj-page ${
                        num === safePage ? "is-current" : ""
                      }`}
                    >
                      {num}
                    </button>
                  )
                )}

                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => handlePageChange(safePage + 1)}
                  aria-label="Trang tiếp"
                  className="v2-prj-page"
                >
                  <ChevronRight width={20} height={20} strokeWidth={2} aria-hidden="true" />
                </button>

                <span>
                  Trang: <b>{safePage}</b> / {totalPages}
                </span>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

/* ============================================================
   PROJECT DETAIL VIEW (/du-an/[slug])
   ============================================================ */
function normalizeVietnamese(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function findLinkedProducts(
  project: ProjectItem,
  allProducts: Product[]
): Product[] {
  const matched: Product[] = [];
  const seen = new Set<string>();

  for (const item of project.scope) {
    const scopeWords = normalizeVietnamese(item)
      .split(/\s+/)
      .filter((w) => w.length >= 4);
    for (const prod of allProducts) {
      if (seen.has(prod.slug)) continue;
      const prodNorm = normalizeVietnamese(prod.name);
      const hits = scopeWords.filter((w) => prodNorm.includes(w));
      if (hits.length >= 2) {
        seen.add(prod.slug);
        matched.push(prod);
      }
    }
  }
  return matched.slice(0, 6);
}

export function ProjectDetailView({
  project,
  allProjects = defaultProjects,
  allProducts = defaultProducts,
}: {
  project: ProjectItem;
  allProjects?: ProjectItem[];
  allProducts?: Product[];
}) {
  const brandConfig = useSiteSettings();
  const [albumIdx, setAlbumIdx] = useState(0);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [relatedAt, setRelatedAt] = useState(0);
  const [trailShown, setTrailShown] = useState(false);
  const [activeSection, setActiveSection] = useState("intro");

  const bannerRef = useRef<HTMLElement>(null);
  const headRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLElement>(null);
  const albumRef = useRef<HTMLElement>(null);
  const productsRef = useRef<HTMLElement>(null);
  const relatedRef = useRef<HTMLElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const lightboxCloseRef = useRef<HTMLButtonElement>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);
  const wasLightboxOpenRef = useRef(false);
  const lightboxTouchStartRef = useRef<{ x: number; y: number } | null>(null);

  const linkedProducts = useMemo(
    () => findLinkedProducts(project, allProducts),
    [allProducts, project]
  );

  const relatedProjects = useMemo(() => {
    const sameType = allProjects.filter(
      (p) => p.type === project.type && p.slug !== project.slug
    );
    const others = allProjects.filter(
      (p) => p.type !== project.type && p.slug !== project.slug
    );
    return [...sameType, ...others].slice(0, 4);
  }, [allProjects, project]);

  useEffect(() => {
    const onScroll = () => {
      const bannerEl = bannerRef.current;
      if (bannerEl) {
        const rect = bannerEl.getBoundingClientRect();
        setTrailShown(rect.bottom <= 80);
      }

      const sections: { id: string; el: HTMLElement | null }[] = [
        { id: "intro", el: introRef.current },
        { id: "album", el: albumRef.current },
        { id: "products", el: productsRef.current },
        { id: "related", el: relatedRef.current },
      ];
      for (let i = sections.length - 1; i >= 0; i--) {
        const s = sections[i];
        if (s.el && s.el.getBoundingClientRect().top <= 240) {
          setActiveSection(s.id);
          break;
        }
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const isLightboxOpen = lightboxIdx !== null;

  useEffect(() => {
    if (isLightboxOpen) {
      wasLightboxOpenRef.current = true;
      lightboxCloseRef.current?.focus();
    } else if (wasLightboxOpenRef.current) {
      wasLightboxOpenRef.current = false;
      lastTriggerRef.current?.focus();
      lastTriggerRef.current = null;
    }
  }, [isLightboxOpen]);

  useEffect(() => {
    if (lightboxIdx === null) return;
    const total = project.gallery.length;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setLightboxIdx(null);
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setLightboxIdx((prev) =>
          prev === null ? null : (prev - 1 + total) % total
        );
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setLightboxIdx((prev) => (prev === null ? null : (prev + 1) % total));
        return;
      }
      if (e.key === "Tab") {
        const container = lightboxRef.current;
        if (!container) return;
        const focusables = Array.from(
          container.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => {
          const style = window.getComputedStyle(el);
          return style.display !== "none" && style.visibility !== "hidden";
        });
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey) {
          if (!active || !container.contains(active) || active === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (!active || !container.contains(active) || active === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIdx, project.gallery.length]);

  const scrollToRef = (el: HTMLElement | null) => {
    el?.scrollIntoView({ behavior: getScrollBehavior(), block: "start" });
  };

  const scrollToSectionId = (id: string) => {
    const map: Record<string, HTMLElement | null> = {
      intro: introRef.current,
      album: albumRef.current,
      products: productsRef.current,
      related: relatedRef.current,
    };
    map[id]?.scrollIntoView({ behavior: getScrollBehavior(), block: "start" });
  };

  const totalGallery = project.gallery.length;
  const maxDesktopRelatedAt = Math.max(0, relatedProjects.length - 3);
  const mobileRelatedDots = Math.max(1, Math.ceil(relatedProjects.length / 2));

  const tocItems = [
    { id: "intro", label: "Giới thiệu" },
    { id: "album", label: "Hình ảnh dự án" },
    { id: "products", label: "Sản phẩm sử dụng" },
    { id: "related", label: "Dự án liên quan" },
  ];

  const tickerText = `Dự án ◦ ${project.typeLabel} ◦ ${project.title} ◦ `;

  return (
    <div className="v2-prjd">
      {/* Floating Header-Aware Breadcrumb Bar */}
      <nav
        aria-label="Breadcrumb dự án"
        aria-hidden={!trailShown}
        className={`v2-prjd-trail is-still ${trailShown ? "is-shown" : ""}`}
      >
        <div className="v2-prjd-trail-desktop">
          <Link href="/" tabIndex={trailShown ? 0 : -1}>
            Trang chủ
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/du-an" tabIndex={trailShown ? 0 : -1}>
            Dự án
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href={`/du-an/loai/${project.type}`}
            tabIndex={trailShown ? 0 : -1}
          >
            {project.typeLabel}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="v2-prjd-trail-name">
            <span>{project.title} · {project.title} · </span>
          </span>
        </div>

        <div className="v2-prjd-trail-mobile">
          <Link
            href="/du-an"
            aria-label="Về trang dự án"
            className="v2-prjd-trail-home"
            tabIndex={trailShown ? 0 : -1}
          >
            <Home width={15} height={15} strokeWidth={2} aria-hidden="true" />
          </Link>
          <div className="v2-prjd-trail-view">
            <span>
              Dự án / {project.typeLabel} / {project.title} · Dự án /{" "}
              {project.typeLabel} / {project.title}
            </span>
          </div>
        </div>
      </nav>

      {/* 1. Fullscreen Banner */}
      <section ref={bannerRef} className="v2-prjd-banner">
        <div className="v2-cat-banner-media">
          <img
            src={project.coverImage}
            alt={`${project.title} — ${brandConfig.name}`}
          />
        </div>
        <div className="v2-prjd-banner-copy">
          <p className="v2-prj-eyebrow">Dự án</p>
          <p className="v2-split is-chars is-alternate v2-prjd-banner-kind">
            <SplitChars text={project.typeLabel} />
          </p>
        </div>
        <button
          type="button"
          className="v2-cat-down v2-round"
          aria-label="Xem thông tin dự án"
          onClick={() => scrollToRef(headRef.current)}
        >
          <ArrowDown width={16} height={16} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </section>

      {/* 2. Head & 4-Row TOC */}
      <section ref={headRef} className="v2-prjd-head">
        <div>
          <h1 className="v2-prjd-title v2-reveal">{project.title}</h1>
          <p className="v2-prjd-line v2-reveal">
            {project.location} · Diện tích {project.area} · Hoàn thiện{" "}
            {project.year}
          </p>
        </div>

        <div className="v2-prjd-toc" role="navigation" aria-label="Mục lục dự án">
          {tocItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollToSectionId(item.id)}
              className={`v2-prjd-toc-row ${
                activeSection === item.id ? "is-active" : ""
              }`}
            >
              <span>{item.label}</span>
              <ChevronDown
                width={20}
                height={20}
                strokeWidth={2.5}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      </section>

      {/* 3. Intro & Project Facts */}
      <section
        id="prjd-intro"
        ref={introRef}
        data-section="intro"
        className="v2-prjd-intro"
      >
        <dl className="v2-prjd-facts">
          <dt>Phân loại</dt>
          <dd>{project.typeLabel}</dd>
          <dt>Địa điểm</dt>
          <dd>
            {project.location} · {project.area}
          </dd>
          <dt>Hoàn thiện</dt>
          <dd>{project.year}</dd>
        </dl>

        <h2 className="v2-prjd-intro-title">Giới thiệu công trình</h2>
        <p className="v2-prjd-text">{project.summary}</p>

        <div className="v2-prjd-scope" aria-label="Hạng mục nội thất chính">
          {project.scope.map((item) => (
            <span key={item} className="v2-prjd-scope-tag">
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* 4. Album Carousel + Lightbox */}
      <section
        id="prjd-album"
        ref={albumRef}
        data-section="album"
        className="v2-prjd-album"
      >
        <h2 className="v2-prjd-album-title v2-reveal">Hình ảnh dự án</h2>

        <div className="v2-prjd-carousel">
          <div
            className="v2-prjd-track"
            style={{
              transform: `translateX(calc(-${albumIdx} * 24vw))`,
            }}
          >
            {project.gallery.map((imgSrc, idx) => (
              <button
                key={`${imgSrc}-${idx}`}
                type="button"
                onClick={(e) => {
                  lastTriggerRef.current = e.currentTarget;
                  setLightboxIdx(idx);
                }}
                aria-label={`Phóng to ảnh ${idx + 1} của ${project.title}`}
                className="v2-prjd-frame"
              >
                <img
                  src={imgSrc}
                  alt={`${project.title} — ảnh ${idx + 1}`}
                />
              </button>
            ))}
          </div>

          {totalGallery > 1 && (
            <>
              <button
                type="button"
                disabled={albumIdx <= 0}
                onClick={() => setAlbumIdx((prev) => Math.max(0, prev - 1))}
                aria-label="Ảnh trước"
                className="v2-prjd-carousel-step is-prev"
              >
                <ChevronLeft
                  width={30}
                  height={30}
                  strokeWidth={1.2}
                  aria-hidden="true"
                />
              </button>
              <button
                type="button"
                disabled={albumIdx >= totalGallery - 1}
                onClick={() =>
                  setAlbumIdx((prev) => Math.min(totalGallery - 1, prev + 1))
                }
                aria-label="Ảnh tiếp"
                className="v2-prjd-carousel-step is-next"
              >
                <ChevronRight
                  width={30}
                  height={30}
                  strokeWidth={1.2}
                  aria-hidden="true"
                />
              </button>
            </>
          )}
        </div>
      </section>

      {/* Lightbox Dialog */}
      {lightboxIdx !== null && (
        <div
          ref={lightboxRef}
          className="v2-pd-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Album ${project.title}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightboxIdx(null);
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            const touch = e.touches[0] ?? e.changedTouches[0];
            if (touch) {
              lightboxTouchStartRef.current = {
                x: touch.clientX,
                y: touch.clientY,
              };
            }
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            const start = lightboxTouchStartRef.current;
            lightboxTouchStartRef.current = null;
            if (!start || totalGallery <= 1) return;
            const touch = e.changedTouches[0] ?? e.touches[0];
            if (!touch) return;
            const dx = touch.clientX - start.x;
            const dy = touch.clientY - start.y;
            if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy)) {
              if (dx < 0) {
                setLightboxIdx((prev) =>
                  prev === null ? null : (prev + 1) % totalGallery
                );
              } else {
                setLightboxIdx((prev) =>
                  prev === null ? null : (prev - 1 + totalGallery) % totalGallery
                );
              }
            }
          }}
          onTouchCancel={(e) => {
            e.stopPropagation();
            lightboxTouchStartRef.current = null;
          }}
        >
          <div className="v2-pd-lightbox-head">
            <h3 className="v2-pd-lightbox-title">{project.title}</h3>
            <button
              ref={lightboxCloseRef}
              type="button"
              onClick={() => setLightboxIdx(null)}
              aria-label="Đóng album ảnh"
              className="v2-pd-lightbox-close v2-round"
            >
              <X width={20} height={20} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <div className="v2-pd-lightbox-stage">
            <img
              src={project.gallery[lightboxIdx]}
              alt={`${project.title} — ảnh ${lightboxIdx + 1}`}
            />
            {totalGallery > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIdx(
                      (lightboxIdx - 1 + totalGallery) % totalGallery
                    )
                  }
                  aria-label="Ảnh trước"
                  className="v2-pd-lightbox-step is-prev v2-round"
                >
                  <ChevronLeft
                    width={28}
                    height={28}
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIdx((lightboxIdx + 1) % totalGallery)
                  }
                  aria-label="Ảnh tiếp"
                  className="v2-pd-lightbox-step is-next v2-round"
                >
                  <ChevronRight
                    width={28}
                    height={28}
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </button>
              </>
            )}
          </div>

          <p className="v2-pd-lightbox-count">
            {lightboxIdx + 1} / {totalGallery}
          </p>
        </div>
      )}

      {/* 5. Linked Products & Consultation CTA */}
      <section
        id="prjd-products"
        ref={productsRef}
        data-section="products"
        className="v2-prjd-side v2-prjd-products"
      >
        <div>
          <h2 className="v2-prjd-side-heading v2-reveal">Sản phẩm sử dụng</h2>
          <p className="v2-prjd-side-sub">
            Các dòng nội thất do {brandConfig.name} thiết kế và sản xuất đồng bộ
            cho công trình.
          </p>
          <Link href="/#footer" className="v2-prjo-all v2-more">
            <span className="v2-more-label">Tư vấn công trình</span>
            <MoreIcon />
          </Link>
        </div>

        <div>
          {linkedProducts.length > 0 ? (
            <div className="v2-prjd-swatches">
              {linkedProducts.map((prod) => (
                <Link
                  key={prod.slug}
                  href={`/san-pham/${prod.slug}`}
                  className="v2-prjd-swatch"
                >
                  <div className="v2-prjd-swatch-pic">
                    <img src={prod.images[0]} alt={prod.name} />
                  </div>
                  <h3 className="v2-prjd-swatch-name">{prod.name}</h3>
                  <p className="v2-prjd-swatch-code">{prod.categoryName}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="v2-cat-empty">
              Danh sách sản phẩm chi tiết đang được {brandConfig.name} cập nhật.
              Vui lòng liên hệ tư vấn để nhận hồ sơ vật liệu đầy đủ.
            </p>
          )}
        </div>
      </section>

      {/* 6. Ticker */}
      <div className="v2-prjd-ticker" aria-hidden="true">
        <div className="v2-prjd-ticker-track">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={`t-${i}`} className="v2-prjd-ticker-item">
              <span>{tickerText}</span>
              <b>{brandConfig.name}</b>
            </span>
          ))}
        </div>
      </div>

      {/* 7. Related Projects */}
      <section
        id="prjd-related"
        ref={relatedRef}
        data-section="related"
        className="v2-prjd-side v2-prjd-related"
      >
        <div>
          <h2 className="v2-prjd-side-heading v2-reveal">Dự án liên quan</h2>
        </div>

        <div className="v2-prjd-related-body">
          <div
            className="v2-prjd-related-track"
            style={{ "--at": relatedAt } as React.CSSProperties}
          >
            {relatedProjects.map((rel) => (
              <Link
                key={rel.slug}
                href={`/du-an/${rel.slug}`}
                className="v2-prjd-related-card v2-prj-card"
              >
                <div className="v2-prj-card-pic">
                  <img src={rel.coverImage} alt={rel.title} />
                </div>
                <h3 className="v2-prj-card-name">{rel.title}</h3>
                <span className="v2-prj-card-line">
                  {rel.location} · {rel.area} · {rel.year}
                </span>
              </Link>
            ))}
          </div>

          <div className="v2-prjd-related-foot">
            <div
              className="v2-prjd-related-rail"
              style={
                {
                  "--fill": `${
                    maxDesktopRelatedAt === 0
                      ? 100
                      : Math.round(((relatedAt + 1) / (maxDesktopRelatedAt + 1)) * 100)
                  }%`,
                } as React.CSSProperties
              }
            />
            <button
              type="button"
              disabled={relatedAt <= 0}
              onClick={() => setRelatedAt((prev) => Math.max(0, prev - 1))}
              aria-label="Dự án liên quan trước"
              className="v2-round"
            >
              <ArrowLeft width={18} height={18} strokeWidth={2} aria-hidden="true" />
            </button>
            <button
              type="button"
              disabled={relatedAt >= maxDesktopRelatedAt}
              onClick={() =>
                setRelatedAt((prev) => Math.min(maxDesktopRelatedAt, prev + 1))
              }
              aria-label="Dự án liên quan tiếp"
              className="v2-round"
            >
              <ArrowRight width={18} height={18} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          {mobileRelatedDots > 1 && (
            <div className="v2-prj-dots" role="tablist" aria-label="Chọn dự án liên quan">
              {Array.from({ length: mobileRelatedDots }).map((_, idx) => (
                <button
                  key={`rel-dot-${idx}`}
                  type="button"
                  role="tab"
                  aria-selected={relatedAt === idx}
                  aria-label={`Nhóm dự án liên quan ${idx + 1}`}
                  onClick={() => setRelatedAt(idx)}
                  className={`v2-prj-dot ${relatedAt === idx ? "is-active" : ""}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
