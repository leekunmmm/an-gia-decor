"use client";

import React from "react";
import { Hammer, Leaf, ShieldCheck } from "lucide-react";
import { commitmentData } from "@/data/homepage";
import { MorePill } from "./MorePill";

const MARQUEE_PHRASES = [
  { text: "AN GIA DECOR", strong: true },
  { text: "CHẤT LIỆU DA CHỐNG TRẦY", strong: false },
  { text: "GỖ ÓC CHÓ BẮC MỸ", strong: true },
  { text: "KIỂM ĐỊNH 18 ĐIỂM", strong: false },
  { text: "BẢO HÀNH KHUNG 5 NĂM", strong: true },
  { text: "MAY ĐO THEO MẶT BẰNG", strong: false },
];

export function CommitmentSection({
  stageImage = commitmentData.stageImage,
  stageVideoUrl = commitmentData.stageVideoUrl,
  stageCaption = commitmentData.stageCaption,
}: {
  stageImage?: string;
  stageVideoUrl?: string;
  stageCaption?: string;
}) {
  return (
    <section className="v2-section is-slate v2-commit" aria-label="Cam kết chất lượng">
      <div className="v2-wrap">
        <div className="v2-commit-head">
          <h2 className="v2-commit-heading" data-reveal="">
            {commitmentData.headingStart}
            <span className="v2-commit-line is-highlight">
              {commitmentData.headingHighlight}
            </span>
          </h2>

          <div className="v2-commit-icons" aria-hidden="true">
            <Leaf className="v2-commit-icon" strokeWidth={1.2} />
            <ShieldCheck className="v2-commit-icon" strokeWidth={1.2} />
            <Hammer className="v2-commit-icon" strokeWidth={1.2} />
          </div>
        </div>

        {/* Wide Visual Stage (R3 video/poster ready-slot) */}
        <div className="v2-commit-stage">
          <div className="v2-video-slot">
            <video
              className="v2-commit-video"
              poster={stageImage}
              src={stageVideoUrl || undefined}
              preload={stageVideoUrl ? "metadata" : "none"}
              autoPlay={Boolean(stageVideoUrl)}
              muted
              loop
              playsInline
              aria-label={stageCaption}
            />
            <div className="v2-media-vignette" />
          </div>
          <p className="v2-commit-caption">{stageCaption}</p>
        </div>

        {/* Overlapping Frosted Card + Copy */}
        <div className="v2-commit-row-wrap">
          <div className="v2-commit-card" data-reveal="">
            <div className="v2-commit-card-head">
              <Leaf className="w-[22px] h-[22px] text-[#e2ad21] shrink-0" strokeWidth={1.5} />
              <p className="v2-commit-card-title">{commitmentData.cardTitle}</p>
            </div>
            <div className="v2-commit-card-pic">
              <img src={commitmentData.cardImage} alt={commitmentData.cardTitle} />
            </div>
          </div>

          <div className="v2-commit-copy" data-reveal="">
            <p className="v2-commit-body">{commitmentData.description}</p>
            <MorePill href={commitmentData.ctaHref} label={commitmentData.ctaLabel} filled />
          </div>
        </div>
      </div>

      {/* 54s Bottom Brand Marquee */}
      <div className="v2-marquee" aria-hidden="true">
        <div className="v2-marquee-track">
          {[...MARQUEE_PHRASES, ...MARQUEE_PHRASES].map((item, idx) => (
            <span
              key={idx}
              className={`v2-marquee-item ${item.strong ? "is-strong" : ""}`}
            >
              {item.text}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
