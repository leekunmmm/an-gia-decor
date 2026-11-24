"use client";

import React from "react";
import { MorePill } from "./MorePill";

interface SpotlightSectionProps {
  variant: "side" | "overlay";
  surfaceClass: "is-slate" | "is-ink";
  eyebrow: string;
  label: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  image: string;
  posterImage?: string;
  videoUrl?: string;
}

function renderSpotlightDescription(text: string) {
  const splitIdx = text.indexOf(",");
  if (splitIdx > 0 && splitIdx < 70) {
    return (
      <>
        <strong className="v2-em">{text.slice(0, splitIdx)}</strong>
        {text.slice(splitIdx)}
      </>
    );
  }
  return text;
}

export function SpotlightSection({
  variant,
  surfaceClass,
  label,
  title,
  description,
  ctaLabel,
  href,
  image,
  posterImage,
  videoUrl,
}: SpotlightSectionProps) {
  const poster = posterImage || image;

  if (variant === "side") {
    return (
      <section
        className={`v2-section ${surfaceClass} v2-spotlight is-side`}
        aria-label={title}
      >
        <div className="v2-spotlight-box">
          <div className="v2-spotlight-copy">
            <h2 className="v2-spotlight-label" data-reveal="">
              {label}
            </h2>
            <div className="v2-spotlight-body" data-reveal="">
              <p>{renderSpotlightDescription(description)}</p>
            </div>
          </div>

          <div className="v2-spotlight-picture v2-more-trigger">
            <div className="v2-video-slot">
              <video
                className="v2-spotlight-video"
                poster={poster}
                src={videoUrl || undefined}
                preload={videoUrl ? "metadata" : "none"}
                autoPlay={Boolean(videoUrl)}
                muted
                loop
                playsInline
                aria-label={title}
              />
              <div className="v2-media-vignette" />
            </div>

            <h3 className="v2-spotlight-name">{title}</h3>

            <div className="v2-spotlight-action">
              <MorePill href={href} label={ctaLabel} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`v2-section ${surfaceClass} v2-spotlight is-overlay`}
      aria-label={title}
    >
      <div className="v2-spotlight-box">
        <div className="v2-spotlight-picture v2-more-trigger">
          <div className="v2-video-slot">
            <video
              className="v2-spotlight-video"
              poster={poster}
              src={videoUrl || undefined}
              preload={videoUrl ? "metadata" : "none"}
              autoPlay={Boolean(videoUrl)}
              muted
              loop
              playsInline
              aria-label={title}
            />
            <div className="v2-media-vignette" />
          </div>

          <h2 className="v2-spotlight-name">{title}</h2>

          <div className="v2-spotlight-copy" data-reveal="">
            <span className="v2-spotlight-label">{label}</span>
            <div className="v2-spotlight-body">
              <p>{renderSpotlightDescription(description)}</p>
            </div>
          </div>

          <div className="v2-spotlight-action">
            <MorePill href={href} label={ctaLabel} />
          </div>
        </div>
      </div>
    </section>
  );
}
