"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Play, X } from "lucide-react";
import {
  videoReels as defaultVideoReels,
  type VideoReel,
} from "@/data/homepage";
import { useSiteSettings } from "@/context/SiteSettingsContext";

const DEFAULT_TIKTOK_HANDLE = "noithathiendai10";

function extractTikTokHandle(url?: string): string {
  const match = url?.match(/@([a-zA-Z0-9._-]+)/);
  return match?.[1] || DEFAULT_TIKTOK_HANDLE;
}

function extractTikTokVideoId(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/\/video\/(\d{15,22})/);
  return match?.[1] ?? null;
}

export function VideoReelsCarousel({
  reels = defaultVideoReels,
}: {
  reels?: VideoReel[];
}) {
  const brandConfig = useSiteSettings();
  const rowRef = useRef<HTMLDivElement>(null);
  const [activeReelId, setActiveReelId] = useState<string | null>(null);
  const displayReels = reels.length > 0 ? reels : defaultVideoReels;

  const tiktokHandle = useMemo(
    () => extractTikTokHandle(brandConfig.tiktokUrl),
    [brandConfig.tiktokUrl]
  );
  const channelUrl = `https://www.tiktok.com/@${tiktokHandle}`;

  useEffect(() => {
    if (!activeReelId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveReelId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeReelId]);

  const scrollByCards = (dir: number) => {
    const el = rowRef.current;
    if (!el) return;
    const step = Math.max(300, el.clientWidth * 0.65);
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({
      left: dir * step,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  };

  return (
    <section
      className="v2-section is-black"
      aria-labelledby="v2-tiktok-heading"
    >
      <div className="v2-wrap">
        <div className="v2-tiktok-head" data-reveal="">
          <div>
            <p className="v2-eyebrow">TikTok</p>
            <h2 id="v2-tiktok-heading" className="v2-title">
              Video từ {brandConfig.name}
            </h2>
          </div>

          <div className="v2-tiktok-arrows">
            <button
              type="button"
              onClick={() => scrollByCards(-1)}
              aria-label="Video trước"
              className="v2-circle-btn"
            >
              <ArrowLeft className="w-[22px] h-[22px]" />
            </button>
            <button
              type="button"
              onClick={() => scrollByCards(1)}
              aria-label="Video tiếp theo"
              className="v2-circle-btn"
            >
              <ArrowRight className="w-[22px] h-[22px]" />
            </button>
          </div>
        </div>

        <div ref={rowRef} className="v2-tiktok-row" data-lenis-prevent>
          {displayReels.map((reel) => {
            const tiktokVideoId =
              reel.tiktokVideoId || extractTikTokVideoId(reel.tiktokUrl);
            const isPlaying = activeReelId === reel.id;

            return (
              <article
                key={reel.id}
                className="v2-tiktok-card group text-left"
              >
                {isPlaying ? (
                  <>
                    <img
                      src={reel.posterImage}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 z-[1] w-full h-full object-cover opacity-50"
                    />
                    {reel.videoUrl ? (
                      <video
                        src={reel.videoUrl}
                        poster={reel.posterImage}
                        controls
                        autoPlay
                        playsInline
                        className="absolute inset-0 z-[5] w-full h-full object-cover bg-black"
                      />
                    ) : tiktokVideoId ? (
                      <iframe
                        key={tiktokVideoId}
                        src={`https://www.tiktok.com/player/v1/${tiktokVideoId}?rel=0&description=0&music_info=0&autoplay=1`}
                        title={reel.title}
                        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 z-[5] w-full h-full border-0 bg-black"
                      />
                    ) : (
                      <img
                        src={reel.posterImage}
                        alt={reel.title}
                        className="absolute inset-0 z-[5] w-full h-full object-cover"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveReelId(null)}
                      aria-label="Đóng trình phát video"
                      className="absolute top-3 left-3 z-[6] w-8 h-8 rounded-full bg-black/75 border border-white/25 text-white grid place-items-center hover:bg-[#e2ad21] hover:text-black transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="v2-video-slot block">
                      {reel.videoUrl ? (
                        <video
                          poster={reel.posterImage}
                          src={reel.videoUrl}
                          preload="metadata"
                          autoPlay
                          muted
                          loop
                          playsInline
                          aria-label={reel.title}
                          className="transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <img
                          src={reel.posterImage}
                          alt={reel.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      )}
                      <span className="v2-media-vignette" aria-hidden="true" />
                    </span>

                    <span
                      className="block absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/20 pointer-events-none"
                      aria-hidden="true"
                    />
                    <span className="absolute top-3.5 left-3.5 z-[3] px-3 py-1 rounded-full bg-black/55 backdrop-blur-md text-[11px] font-semibold text-white pointer-events-none">
                      {reel.categoryLabel}
                    </span>
                    <span className="absolute top-3.5 right-3.5 z-[3] text-[11px] font-medium text-white/80 pointer-events-none">
                      @{tiktokHandle}
                    </span>

                    <span className="v2-tiktok-play pointer-events-none" aria-hidden="true">
                      <Play
                        className="w-7 h-7 fill-current/15 translate-x-[1px]"
                        strokeWidth={1.7}
                      />
                    </span>

                    <span className="block absolute bottom-4 left-4 right-4 z-[3] pointer-events-none">
                      <span className="block text-sm font-semibold text-white leading-snug line-clamp-2">
                        {reel.title}
                      </span>
                      <span className="block text-[11px] text-[#cccccc] mt-1.5">
                        {reel.views}
                      </span>
                    </span>

                    <button
                      type="button"
                      onClick={() => setActiveReelId(reel.id)}
                      aria-label={`Phát video: ${reel.title}`}
                      className="absolute inset-0 z-[4] w-full h-full cursor-pointer border-0 bg-transparent p-0"
                    />
                  </>
                )}
              </article>
            );
          })}
        </div>

        <div className="v2-tiktok-more flex justify-center md:justify-start">
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="v2-pill"
          >
            <span>Xem kênh TikTok</span>
            <ArrowRight className="w-4 h-4 v2-arrow" />
          </a>
        </div>
      </div>
    </section>
  );
}
