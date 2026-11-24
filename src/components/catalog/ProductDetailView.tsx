"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Heart,
  Home,
  Image as ImageIcon,
  Maximize2,
  Minus,
  Plus,
  X,
} from "lucide-react";
import "@/styles/pages/product-detail.css";
import type { Product } from "@/data/products";
import { ChannelAnchor, getChannelItems } from "@/components/layout/ChannelIcons";
import { useUI } from "@/context/UIContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";

interface ProductDetailViewProps {
  product: Product;
  related: Product[];
}

interface ZoomState {
  lensW: number;
  lensH: number;
  lensLeft: number;
  lensTop: number;
  stageW: number;
  stageH: number;
}

const ZOOM_SCALE = 2.5;

function renderSplitChars(text: string) {
  const words = text.trim().split(/\s+/);
  let charCursor = 0;

  return words.map((word, wordIdx) => {
    const chars = Array.from(word);
    const wordEl = (
      <span
        key={`w-${wordIdx}`}
        aria-hidden="true"
        className="v2-split-word"
        style={{ "--word-index": wordIdx } as React.CSSProperties}
      >
        {chars.map((ch) => {
          const idx = charCursor++;
          return (
            <span
              key={`c-${idx}`}
              className="v2-split-char"
              style={{ "--char-index": idx } as React.CSSProperties}
            >
              {ch}
            </span>
          );
        })}
      </span>
    );

    if (wordIdx < words.length - 1) {
      return (
        <React.Fragment key={`wf-${wordIdx}`}>
          {wordEl}{" "}
        </React.Fragment>
      );
    }
    return wordEl;
  });
}

function BreadcrumbList({
  product,
  tickerDuration,
}: {
  product: Product;
  tickerDuration: string;
}) {
  return (
    <ol>
      <li>
        <Link href="/" aria-label="Trang chủ">
          <Home size={14} strokeWidth={2} aria-hidden="true" />
          <span className="sr-only">Trang chủ</span>
        </Link>
      </li>
      <li>
        <Link href={`/danh-muc/${product.groupId}`}>{product.groupName}</Link>
      </li>
      <li>
        <Link href={`/danh-muc/${product.categorySlug}`}>
          {product.categoryName}
        </Link>
      </li>
      <li className="v2-pd-crumbs-current">
        <span className="sr-only" aria-current="page">
          {product.name}
        </span>
        <div
          className="v2-pd-ticker"
          aria-hidden="true"
          style={{ "--ticker-duration": tickerDuration } as React.CSSProperties}
        >
          <div>
            <p>{product.name}</p>
            <p>{product.name}</p>
          </div>
          <div>
            <p>{product.name}</p>
            <p>{product.name}</p>
          </div>
        </div>
      </li>
    </ol>
  );
}

export function ProductDetailView({ product, related }: ProductDetailViewProps) {
  const { isWishlisted, toggleWishlist, showToast, lenisRef } = useUI();

  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState(
    () => product.colors[0] ?? ""
  );
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [relatedOpen, setRelatedOpen] = useState(true);
  const [isPinned, setIsPinned] = useState(false);
  const [stageHeight, setStageHeight] = useState<number | null>(null);
  const [zoomState, setZoomState] = useState<ZoomState | null>(null);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const lightboxRef = useRef<HTMLDivElement | null>(null);
  const lightboxCloseRef = useRef<HTMLButtonElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const prevSlugRef = useRef(product.slug);

  const isLightboxOpen = lightboxIdx !== null;
  const isZooming = zoomState !== null;

  const wishlisted = isWishlisted(product.slug);
  const currentImage = product.images[activeImgIdx] || product.images[0];

  const lightboxImages = useMemo(() => {
    if (product.images.includes(product.applicationImage)) {
      return product.images;
    }
    return [...product.images, product.applicationImage];
  }, [product.images, product.applicationImage]);

  const appLightboxIdx = useMemo(() => {
    const idx = lightboxImages.indexOf(product.applicationImage);
    return idx >= 0 ? idx : 0;
  }, [lightboxImages, product.applicationImage]);

  const tickerDuration = useMemo(() => {
    const secs = Math.max(14, Math.min(32, Math.round(product.name.length * 0.78)));
    return `${secs}s`;
  }, [product.name]);

  const settings = useSiteSettings();
  const channels = useMemo(
    () => getChannelItems(["zalo", "messenger", "shopee", "hotline"], settings),
    [settings]
  );

  // Defense-in-depth reset if ProductDetailView stays mounted across slug changes
  useEffect(() => {
    if (prevSlugRef.current === product.slug) return;
    prevSlugRef.current = product.slug;
    const resetForSlug = () => {
      setActiveImgIdx(0);
      setSelectedColor(product.colors[0] ?? "");
      setLightboxIdx(null);
      setZoomState(null);
      setRelatedOpen(true);
      setIsPinned((window.scrollY || 0) > 200);
    };
    resetForSlug();
  }, [product.slug, product.colors]);

  // Sync pinned breadcrumb bar at scrollY > 200
  useEffect(() => {
    const updatePinned = () => {
      setIsPinned((window.scrollY || 0) > 200);
    };
    updatePinned();
    window.addEventListener("scroll", updatePinned, { passive: true });
    return () => window.removeEventListener("scroll", updatePinned);
  }, []);

  // Sync --stage-height on desktop via ResizeObserver on .v2-pd-stage
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const updateHeight = () => {
      const rect = el.getBoundingClientRect();
      if (rect.height > 0) {
        setStageHeight(rect.height);
      }
    };

    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Lightbox scroll lock & focus management (keyed on open state, not slide index)
  useEffect(() => {
    if (!isLightboxOpen) return;

    const triggerEl =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const lenis = lenisRef.current;
    lenis?.stop();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    lightboxCloseRef.current?.focus({ preventScroll: true });

    return () => {
      document.body.style.overflow = prevOverflow;
      lenis?.start();
      if (triggerEl && triggerEl.isConnected) {
        triggerEl.focus({ preventScroll: true });
      }
    };
  }, [isLightboxOpen, lenisRef]);

  // Lightbox keyboard navigation
  useEffect(() => {
    if (!isLightboxOpen) return;

    const total = lightboxImages.length;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setLightboxIdx(null);
      } else if (e.key === "ArrowLeft" && total > 1) {
        setLightboxIdx((prev) =>
          prev === null ? null : (prev - 1 + total) % total
        );
      } else if (e.key === "ArrowRight" && total > 1) {
        setLightboxIdx((prev) => (prev === null ? null : (prev + 1) % total));
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [isLightboxOpen, lightboxImages.length]);

  // Clear magnifier on viewport resize or scroll while zooming
  useEffect(() => {
    if (!isZooming) return;

    const clearZoom = () => setZoomState(null);
    window.addEventListener("resize", clearZoom, { passive: true });
    window.addEventListener("scroll", clearZoom, { passive: true });
    return () => {
      window.removeEventListener("resize", clearZoom);
      window.removeEventListener("scroll", clearZoom);
    };
  }, [isZooming]);

  const handleStagePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== "mouse") {
        setZoomState(null);
        return;
      }

      const target = e.target as HTMLElement | null;
      if (target?.closest(".v2-pd-tools, .v2-pd-count")) {
        setZoomState(null);
        return;
      }

      if (
        typeof window === "undefined" ||
        !window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1100px)")
          .matches
      ) {
        setZoomState(null);
        return;
      }

      const stage = stageRef.current;
      const box = boxRef.current;
      if (!stage || !box) return;

      const stageRect = stage.getBoundingClientRect();
      const boxRect = box.getBoundingClientRect();
      if (
        stageRect.width <= 0 ||
        stageRect.height <= 0 ||
        boxRect.width <= 0 ||
        boxRect.height <= 0
      ) {
        setZoomState(null);
        return;
      }

      const lensW = Math.min(stageRect.width, boxRect.width / ZOOM_SCALE);
      const lensH = Math.min(stageRect.height, boxRect.height / ZOOM_SCALE);

      const relX = e.clientX - stageRect.left;
      const relY = e.clientY - stageRect.top;

      const lensLeft = Math.max(
        0,
        Math.min(stageRect.width - lensW, relX - lensW / 2)
      );
      const lensTop = Math.max(
        0,
        Math.min(stageRect.height - lensH, relY - lensH / 2)
      );

      setZoomState({
        lensW,
        lensH,
        lensLeft,
        lensTop,
        stageW: stageRect.width,
        stageH: stageRect.height,
      });
    },
    []
  );

  const handleStagePointerLeave = useCallback(() => {
    setZoomState(null);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  }, []);

  const handleStageTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartXRef.current === null || product.images.length <= 1) return;
      const endX = e.changedTouches[0]?.clientX;
      if (typeof endX !== "number") return;
      const delta = endX - touchStartXRef.current;
      touchStartXRef.current = null;
      if (Math.abs(delta) < 40) return;
      setActiveImgIdx((prev) =>
        delta < 0
          ? (prev + 1) % product.images.length
          : (prev - 1 + product.images.length) % product.images.length
      );
    },
    [product.images.length]
  );

  const handleLightboxTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartXRef.current === null || lightboxImages.length <= 1) return;
      const endX = e.changedTouches[0]?.clientX;
      if (typeof endX !== "number") return;
      const delta = endX - touchStartXRef.current;
      touchStartXRef.current = null;
      if (Math.abs(delta) < 40) return;
      setLightboxIdx((prev) => {
        if (prev === null) return null;
        return delta < 0
          ? (prev + 1) % lightboxImages.length
          : (prev - 1 + lightboxImages.length) % lightboxImages.length;
      });
    },
    [lightboxImages.length]
  );

  const handleToggleFullscreen = useCallback(() => {
    const el = lightboxRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        void document.exitFullscreen();
      } else if (el.requestFullscreen) {
        void el.requestFullscreen();
      }
    } catch {
      // Ignore fullscreen permission errors
    }
  }, []);

  const bannerSplit = useMemo(() => renderSplitChars(product.name), [product.name]);
  const titleSplit = useMemo(() => renderSplitChars(product.name), [product.name]);

  return (
    <div className="v2-pd">
      {/* 1. Blurred Hero Banner */}
      <section className="v2-pd-banner">
        <img
          className="v2-pd-banner-bg"
          src={product.images[0]}
          alt=""
          aria-hidden="true"
        />

        <div className="v2-wrap v2-pd-banner-copy" aria-hidden="true">
          <p className="v2-pd-banner-eyebrow">{product.categoryName}</p>
          <div
            className="v2-split is-chars is-alternate v2-pd-banner-title"
            style={{ "--split-delay": "0.3s" } as React.CSSProperties}
          >
            {bannerSplit}
          </div>
        </div>

        {/* Docked bottom-right breadcrumb */}
        <nav className="v2-pd-crumbs" aria-label="Đường dẫn sản phẩm">
          <BreadcrumbList product={product} tickerDuration={tickerDuration} />
        </nav>
      </section>

      {/* 2. Fixed Pinned Breadcrumb (direct child of .v2-pd) */}
      <nav
        className={`v2-pd-crumbs is-pinned${isPinned ? " is-shown" : ""}`}
        aria-label="Đường dẫn cố định"
        aria-hidden={!isPinned}
      >
        <BreadcrumbList product={product} tickerDuration={tickerDuration} />
      </nav>

      {/* 3. Main Stage + Vertical-Masked Backdrop + Specs */}
      <section className="v2-pd-main">
        <div className="v2-pd-main-bg" aria-hidden="true">
          <img src={currentImage} alt="" />
        </div>

        <div className="v2-pd-wrap">
          <h1
            className="v2-split is-chars is-fade v2-pd-title"
            aria-label={product.name}
            style={{ "--split-delay": "0.35s" } as React.CSSProperties}
          >
            {titleSplit}
          </h1>
          <p className="v2-pd-code">
            Danh mục: <strong>{product.categoryName}</strong>
          </p>

          <div className="v2-pd-layout">
            {/* Left Gallery Column */}
            <div className="v2-pd-gallery">
              <div
                ref={stageRef}
                className={`v2-pd-stage${zoomState ? " is-magnifying" : ""}`}
                onPointerMove={handleStagePointerMove}
                onPointerLeave={handleStagePointerLeave}
                onPointerCancel={handleStagePointerLeave}
                onMouseLeave={handleStagePointerLeave}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleStageTouchEnd}
              >
                <img
                  src={currentImage}
                  alt={`${product.name} – ảnh ${activeImgIdx + 1}`}
                  draggable={false}
                />

                {zoomState && (
                  <div
                    className="v2-pd-lens"
                    aria-hidden="true"
                    style={{
                      width: zoomState.lensW,
                      height: zoomState.lensH,
                      left: zoomState.lensLeft,
                      top: zoomState.lensTop,
                    }}
                  />
                )}

                <div className="v2-pd-tools">
                  <a
                    href={currentImage}
                    download={`${product.slug}.jpg`}
                    onClick={() => showToast("Đang tải ảnh sản phẩm về máy")}
                    aria-label="Tải ảnh về"
                    title="Tải ảnh về"
                    className="v2-pd-tool"
                  >
                    <Download size={18} strokeWidth={1.9} aria-hidden="true" />
                  </a>

                  <button
                    type="button"
                    onClick={() => setLightboxIdx(activeImgIdx)}
                    aria-label="Phóng to ảnh"
                    title="Phóng to ảnh"
                    className="v2-pd-tool"
                  >
                    <Plus size={18} strokeWidth={2} aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleWishlist(product.slug)}
                    aria-label="Yêu thích"
                    aria-pressed={wishlisted}
                    title="Lưu vào yêu thích"
                    className={`v2-pd-tool${wishlisted ? " is-liked" : ""}`}
                  >
                    <Heart
                      size={18}
                      strokeWidth={1.9}
                      className={wishlisted ? "fill-current" : undefined}
                      aria-hidden="true"
                    />
                  </button>
                </div>

                <span className="v2-pd-count">
                  {activeImgIdx + 1} / {product.images.length}
                </span>
              </div>

              {product.images.length > 0 && (
                <div
                  className="v2-pd-thumbs"
                  role="group"
                  aria-label="Chọn ảnh sản phẩm"
                >
                  {product.images.map((img, idx) => {
                    const isActive = idx === activeImgIdx;
                    return (
                      <button
                        key={`${img}-${idx}`}
                        type="button"
                        onClick={() => setActiveImgIdx(idx)}
                        aria-label={`Ảnh ${idx + 1}`}
                        aria-pressed={isActive}
                        className={isActive ? "is-active" : undefined}
                      >
                        <img
                          src={img}
                          alt={`${product.name} góc ${idx + 1}`}
                          loading="lazy"
                          draggable={false}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Consultation Column (height-synced on desktop) */}
            <aside
              className="v2-pd-side"
              style={
                stageHeight
                  ? ({ "--stage-height": `${stageHeight}px` } as React.CSSProperties)
                  : undefined
              }
            >
              <div
                ref={boxRef}
                className={`v2-pd-box${zoomState ? " is-zooming" : ""}`}
              >
                {zoomState && (
                  <div className="v2-pd-zoom" aria-hidden="true">
                    <img
                      src={currentImage}
                      alt=""
                      style={{
                        width: zoomState.stageW * ZOOM_SCALE,
                        height: zoomState.stageH * ZOOM_SCALE,
                        left: -zoomState.lensLeft * ZOOM_SCALE,
                        top: -zoomState.lensTop * ZOOM_SCALE,
                      }}
                    />
                  </div>
                )}

                <div className="v2-pd-app">
                  <button
                    type="button"
                    className="v2-pd-app-pic"
                    onClick={() => setLightboxIdx(appLightboxIdx)}
                    aria-label="Xem ảnh ứng dụng"
                  >
                    <img
                      src={product.applicationImage}
                      alt={`Ứng dụng ${product.name}`}
                      loading="lazy"
                    />
                  </button>

                  <div className="v2-pd-app-head">
                    <div>
                      <p className="v2-pd-app-name">{product.name}</p>
                      <p className="v2-pd-app-sub">Sản phẩm ứng dụng</p>
                    </div>
                    <button
                      type="button"
                      className="v2-round v2-pd-app-open"
                      onClick={() => setLightboxIdx(appLightboxIdx)}
                      aria-label="Phóng to ảnh ứng dụng"
                    >
                      <ImageIcon size={24} strokeWidth={1.6} aria-hidden="true" />
                    </button>
                  </div>

                  <p className="v2-pd-price-line">
                    Giá: <strong>{product.priceLabel}</strong>
                  </p>

                  {product.colors.length > 0 && (
                    <div
                      className="v2-pd-variants"
                      role="group"
                      aria-label="Tùy chọn màu sắc"
                    >
                      {product.colors.map((color) => {
                        const isActive = selectedColor === color;
                        return (
                          <button
                            key={color}
                            type="button"
                            className={isActive ? "is-active" : undefined}
                            aria-pressed={isActive}
                            onClick={() => setSelectedColor(color)}
                          >
                            {color}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="v2-pd-contact">
                    {channels.map((channel) => {
                      const isZalo = channel.key === "zalo";
                      const isHotline = channel.key === "hotline";
                      const labelText = isZalo
                        ? "Nhắn Zalo"
                        : isHotline
                          ? `Gọi ${channel.shortLabel}`
                          : channel.shortLabel;

                      return (
                        <ChannelAnchor
                          key={channel.key}
                          channel={channel}
                          className={
                            isZalo
                              ? "is-zalo"
                              : isHotline
                                ? "is-hotline"
                                : undefined
                          }
                        >
                          {channel.renderIcon({
                            size: 18,
                            variant: "brand",
                          })}
                          <span>{labelText}</span>
                        </ChannelAnchor>
                      );
                    })}
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {/* 4. Specifications & Rich Description */}
          <dl className="v2-pd-facts" data-reveal="">
            <div>
              <dt>Loại sản phẩm:</dt>
              <dd>{product.categoryName}</dd>
            </div>
            <div>
              <dt>Nhóm không gian:</dt>
              <dd>{product.groupName}</dd>
            </div>
            <div>
              <dt>Giá:</dt>
              <dd className="is-price-val">{product.priceLabel}</dd>
            </div>
            <div>
              <dt>Kích thước &amp; chất liệu:</dt>
              <dd>{product.dimensionsAndMaterials}</dd>
            </div>
            <div>
              <dt>Không gian phù hợp:</dt>
              <dd>{product.suitableSpaces.join(" · ")}</dd>
            </div>
            <div>
              <dt>Bảo quản:</dt>
              <dd>{product.careInstructions}</dd>
            </div>

            {product.colors.length > 0 && (
              <div className="is-wide">
                <dt>Màu sắc hoàn thiện:</dt>
                <dd>{product.colors.join(" · ")}</dd>
              </div>
            )}

            <div className="is-wide">
              <dt>Mô tả:</dt>
              <dd className="v2-pd-desc">
                <p>{product.description}</p>
                {product.highlights.length > 0 && (
                  <>
                    <h3>Đặc điểm nổi bật</h3>
                    <ul>
                      {product.highlights.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* 5. Collapsible Related Product Line */}
      <section className="v2-pd-line">
        <div className="v2-pd-line-bar">
          <div className="v2-pd-wrap">
            <span>Gợi ý phối hợp đồng bộ</span>
          </div>
        </div>

        <div className="v2-pd-wrap v2-pd-line-body">
          <button
            type="button"
            className="v2-pd-line-head"
            data-reveal=""
            aria-expanded={relatedOpen}
            onClick={() => setRelatedOpen((prev) => !prev)}
          >
            <span>Dòng sản phẩm liên quan</span>
            {relatedOpen ? (
              <Minus size={22} strokeWidth={1.8} aria-hidden="true" />
            ) : (
              <Plus size={22} strokeWidth={1.8} aria-hidden="true" />
            )}
          </button>

          <div
            className="v2-m-collapse"
            data-open={relatedOpen ? "true" : "false"}
            aria-hidden={!relatedOpen}
            inert={!relatedOpen || undefined}
          >
            <div>
              <div className="v2-cat-grid v2-pd-line-grid">
                {related.map((item, idx) => (
                  <Link
                    key={item.slug}
                    href={`/san-pham/${item.slug}`}
                    className="v2-cat-card v2-reveal"
                    style={{ "--order": idx } as React.CSSProperties}
                  >
                    <div className="v2-cat-card-pic">
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        loading="lazy"
                      />
                    </div>
                    <p className="v2-cat-card-label">{item.categoryName}</p>
                    <h3 className="v2-cat-card-name v2-cat-card-title">
                      {item.name}
                    </h3>
                    <p className="v2-cat-card-sub">Giá: {item.priceLabel}</p>
                  </Link>
                ))}
              </div>

              <Link
                href={`/danh-muc/${product.categorySlug}`}
                className="v2-pd-line-all"
              >
                Xem tất cả {product.categoryName} →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Fullscreen Image Lightbox */}
      {lightboxIdx !== null && (
        <div
          ref={lightboxRef}
          className="v2-pd-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={product.name}
          data-lenis-prevent="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightboxIdx(null);
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleLightboxTouchEnd}
        >
          <p className="v2-pd-lightbox-title">{product.name}</p>

          <button
            ref={lightboxCloseRef}
            type="button"
            className="v2-round v2-pd-lightbox-close"
            onClick={() => setLightboxIdx(null)}
            aria-label="Đóng"
          >
            <X size={20} strokeWidth={2} aria-hidden="true" />
          </button>

          <img
            src={lightboxImages[lightboxIdx] ?? currentImage}
            alt={`${product.name} – ảnh ${lightboxIdx + 1}`}
            draggable={false}
          />

          {lightboxImages.length > 1 && (
            <>
              <button
                type="button"
                className="v2-round v2-pd-lightbox-nav is-prev"
                onClick={() =>
                  setLightboxIdx((prev) =>
                    prev === null
                      ? 0
                      : (prev - 1 + lightboxImages.length) %
                        lightboxImages.length
                  )
                }
                aria-label="Ảnh trước"
              >
                <ArrowLeft size={24} strokeWidth={1.8} aria-hidden="true" />
              </button>

              <button
                type="button"
                className="v2-round v2-pd-lightbox-nav is-next"
                onClick={() =>
                  setLightboxIdx((prev) =>
                    prev === null ? 0 : (prev + 1) % lightboxImages.length
                  )
                }
                aria-label="Ảnh sau"
              >
                <ArrowRight size={24} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </>
          )}

          <span className="v2-pd-lightbox-count">
            {lightboxIdx + 1} / {lightboxImages.length}
          </span>

          <button
            type="button"
            className="v2-round v2-pd-lightbox-full"
            onClick={handleToggleFullscreen}
            aria-label="Toàn màn hình"
          >
            <Maximize2 size={20} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
