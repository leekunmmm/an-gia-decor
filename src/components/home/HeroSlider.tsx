"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { heroSlides as defaultHeroSlides, type HeroSlide } from "@/data/homepage";
import { SplitText } from "./SplitText";

export function HeroSlider({
  slides = defaultHeroSlides,
}: {
  slides?: HeroSlide[];
}) {
  const safeSlides = slides.length > 0 ? slides : defaultHeroSlides;
  const [active, setActive] = useState(0);
  const safeActive = active < safeSlides.length ? active : 0;
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % safeSlides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [safeActive, safeSlides.length]);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    videoRefs.current.forEach((video, idx) => {
      if (!video) return;
      if (idx === safeActive && !prefersReduced) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [safeActive, safeSlides]);

  const current = safeSlides[safeActive];

  const handleTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    const t = e.touches[0];
    if (!t) return;
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLElement>) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy)) {
      setActive((prev) =>
        dx < 0
          ? (prev + 1) % safeSlides.length
          : (prev - 1 + safeSlides.length) % safeSlides.length
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "ArrowRight") {
      setActive((prev) => (prev + 1) % safeSlides.length);
    } else if (e.key === "ArrowLeft") {
      setActive((prev) => (prev - 1 + safeSlides.length) % safeSlides.length);
    }
  };

  return (
    <section
      className="v2-hero-cover v2-hero"
      aria-label="Giới thiệu bộ sưu tập nổi bật"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
    >
      <div className="v2-hero-media">
        {safeSlides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`v2-hero-image ${idx === safeActive ? "is-active" : ""}`}
            aria-hidden={idx !== safeActive}
          >
            {slide.videoUrl ? (
              <video
                ref={(el) => {
                  videoRefs.current[idx] = el;
                }}
                poster={slide.image}
                src={slide.videoUrl}
                preload={idx === safeActive ? "auto" : "metadata"}
                autoPlay={idx === safeActive}
                muted
                loop
                playsInline
                aria-label={slide.title}
              />
            ) : (
              <img src={slide.image} alt={slide.title} />
            )}
            <div className="v2-media-vignette" />
          </div>
        ))}
      </div>

      <div className="v2-hero-scrim" aria-hidden="true" />

      <div className="v2-hero-copy">
        <div className="v2-wrap">
          <span className="v2-eyebrow">{current.eyebrow}</span>
          <SplitText
            key={current.id}
            as="h1"
            mode="chars-alternate"
            text={current.title}
            className="v2-hero-title"
          />
          <p className="v2-hero-text">{current.subtitle}</p>
          <Link href={current.ctaHref} className="v2-pill">
            <span>{current.ctaLabel}</span>
            <ArrowRight className="w-4 h-4 v2-arrow" />
          </Link>
        </div>
      </div>

      {/* Bottom-right bar indicators */}
      <div className="v2-hero-dots" role="group" aria-label="Chọn slide giới thiệu">
        {safeSlides.map((slide, idx) => (
          <button
            key={slide.id}
            type="button"
            aria-pressed={idx === safeActive}
            aria-label={`Slide ${idx + 1}: ${slide.title}`}
            onClick={() => setActive(idx)}
            className={`v2-hero-dot ${idx === safeActive ? "is-active" : ""}`}
          >
            <span className="v2-hero-dot-bar" />
          </button>
        ))}
      </div>
    </section>
  );
}
