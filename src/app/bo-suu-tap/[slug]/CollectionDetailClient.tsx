"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Maximize2, X } from "lucide-react";
import { ChannelAnchor, getChannelItems } from "@/components/layout/ChannelIcons";
import { useUI } from "@/context/UIContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";

interface CollectionGalleryProps {
  images: string[];
  title: string;
  slug: string;
}

export function CollectionGallery({ images, title, slug }: CollectionGalleryProps) {
  const { lenisRef } = useUI();
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  const safeImages = images.length > 0 ? images : ["/images/sofa-nordic.jpg"];
  const currentIdx = activeIdx < safeImages.length ? activeIdx : 0;
  const activeImage = safeImages[currentIdx];

  useEffect(() => {
    if (!lightboxOpen) return;

    prevFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const lenis = lenisRef.current;
    const fallbackTrigger = triggerRef.current;
    lenis?.stop();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    closeBtnRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setLightboxOpen(false);
      } else if (e.key === "ArrowRight" && safeImages.length > 1) {
        setActiveIdx((prev) => (prev + 1) % safeImages.length);
      } else if (e.key === "ArrowLeft" && safeImages.length > 1) {
        setActiveIdx((prev) => (prev - 1 + safeImages.length) % safeImages.length);
      } else if (e.key === "Tab" && dialogRef.current) {
        const focusables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey) {
          if (!active || active === first || !dialogRef.current.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else if (!active || active === last || !dialogRef.current.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = prevOverflow;
      lenis?.start();
      const returnTarget = prevFocusRef.current ?? fallbackTrigger;
      if (returnTarget && returnTarget.isConnected) {
        returnTarget.focus();
      }
      prevFocusRef.current = null;
    };
  }, [lightboxOpen, safeImages.length, lenisRef]);

  return (
    <>
      <div className="v2-pd-gallery">
        <div className="v2-pd-stage">
          <img src={activeImage} alt={`${title} — hình ${currentIdx + 1}`} />

          <div className="v2-pd-tools">
            <a
              href={activeImage}
              download={`${slug}-${currentIdx + 1}.jpg`}
              aria-label="Tải ảnh bộ sưu tập"
              title="Tải ảnh"
            >
              <Download size={16} aria-hidden="true" />
            </a>
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label="Phóng to ảnh"
              title="Phóng to ảnh"
            >
              <Maximize2 size={16} aria-hidden="true" />
            </button>
          </div>

          {safeImages.length > 1 && (
            <span className="v2-pd-count">
              {currentIdx + 1} / {safeImages.length}
            </span>
          )}
        </div>

        {safeImages.length > 1 && (
          <div className="v2-pd-thumbs" role="group" aria-label="Thư viện ảnh bộ sưu tập">
            {safeImages.map((src, idx) => (
              <button
                key={`${src}-${idx}`}
                type="button"
                onClick={() => setActiveIdx(idx)}
                aria-label={`Xem ảnh ${idx + 1} của ${title}`}
                aria-current={idx === currentIdx ? "true" : undefined}
                className={`v2-pd-thumb ${idx === currentIdx ? "is-active" : ""}`}
              >
                <img src={src} alt="" aria-hidden="true" loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && (
        <div
          ref={dialogRef}
          className="v2-bstd-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Xem ảnh ${title}`}
          tabIndex={-1}
          data-lenis-prevent="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightboxOpen(false);
          }}
        >
          <button
            ref={closeBtnRef}
            type="button"
            className="v2-bstd-lightbox-close"
            onClick={() => setLightboxOpen(false)}
            aria-label="Đóng trình xem ảnh"
          >
            <X size={20} aria-hidden="true" />
          </button>

          <div className="v2-bstd-lightbox-inner">
            <img src={activeImage} alt={title} />
            <div className="v2-bstd-lightbox-caption">
              {safeImages.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveIdx((prev) => (prev - 1 + safeImages.length) % safeImages.length)
                  }
                  aria-label="Ảnh trước"
                  className="v2-bstd-lightbox-nav"
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                </button>
              )}
              <span>
                {title} · {currentIdx + 1} / {safeImages.length}
              </span>
              {safeImages.length > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveIdx((prev) => (prev + 1) % safeImages.length)}
                  aria-label="Ảnh tiếp theo"
                  className="v2-bstd-lightbox-nav"
                >
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function CollectionContactChannels() {
  const settings = useSiteSettings();
  const channels = getChannelItems(
    ["zalo", "hotline", "messenger", "shopee"],
    settings
  );

  return (
    <div className="v2-pd-contact">
      {channels.map((ch) => {
        const isZalo = ch.key === "zalo";
        const isShopee = ch.key === "shopee";
        return (
          <ChannelAnchor
            key={ch.key}
            channel={ch}
            className={`v2-pd-contact-btn ${isZalo ? "is-zalo" : ""} ${isShopee ? "is-shopee" : ""}`}
            ariaLabel={ch.label}
          >
            {ch.renderIcon({
              size: 18,
              variant: isZalo ? "current" : "brand",
            })}
            <span>
              {isZalo
                ? "Nhắn Zalo tư vấn bộ sưu tập"
                : isShopee
                  ? ch.label
                  : ch.key === "hotline"
                    ? `Gọi ${ch.shortLabel}`
                    : ch.shortLabel}
            </span>
          </ChannelAnchor>
        );
      })}
    </div>
  );
}
