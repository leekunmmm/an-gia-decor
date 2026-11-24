"use client";

import React, { useState } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { dreamScenes } from "@/data/homepage";
import type { Product } from "@/data/products";
import { HotspotLayer } from "./HotspotLayer";

export function DreamSpacesSection({
  products = [],
}: {
  products?: Product[];
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [showAllMobile, setShowAllMobile] = useState(false);

  const current = dreamScenes[activeIdx];
  const visibleMobileScenes = showAllMobile ? dreamScenes : dreamScenes.slice(0, 3);
  const remainingCount = Math.max(0, dreamScenes.length - visibleMobileScenes.length);

  return (
    <section
      id="rooms"
      className="v2-section is-ink v2-dream"
      aria-label="Khám phá không gian mơ ước"
    >
      {/* Desktop Card (>= 768px) */}
      <div className="v2-dream-card" data-reveal="">
        <div className="v2-dream-flex">
          <div className="v2-dream-side">
            <div className="v2-dream-title">
              <h2>
                <strong>Không gian</strong>
                <span className="v2-dream-line">
                  <em>sống</em> <strong>đích thực</strong>
                </span>
              </h2>
              <span className="v2-dream-pill">{dreamScenes.length} không gian</span>
            </div>

            <div
              role="tablist"
              aria-label="Phối cảnh không gian"
              className="v2-dream-tabs"
            >
              {dreamScenes.map((scene, idx) => {
                const selected = idx === activeIdx;
                return (
                  <button
                    key={scene.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveIdx(idx)}
                    className="v2-dream-tab"
                  >
                    <span
                      className={`text-xs font-bold ${
                        selected ? "text-[#e2ad21]" : "text-[#8a6510]"
                      }`}
                    >
                      {scene.number}
                    </span>
                    <span className="truncate pr-2">{scene.title}</span>
                    <ArrowUpRight className="w-4 h-4 opacity-70" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="v2-dream-cover">
            <div className="v2-dream-cover-media shadow-xl">
              <img
                src={current.image}
                alt={current.title}
                className="transition-all duration-500"
              />
              <div className="v2-media-vignette" />
            </div>

            <HotspotLayer
              key={current.id}
              hotspots={current.hotspots}
              products={products}
            />
          </div>
        </div>
      </div>

      {/* Mobile Stacked View (<= 767px) */}
      <div className="v2-wrap v2-dream-m">
        <div className="v2-dream-m-head">
          <h2>Không gian sống mơ ước</h2>
          <p>Chạm vào điểm ghim trên ảnh để khám phá sản phẩm thực tế.</p>
        </div>

        {visibleMobileScenes.map((scene) => (
          <div key={scene.id} className="v2-dream-m-item">
            <div className="v2-dream-m-title">
              <span className="v2-dream-m-num">{scene.number}</span>
              <h3 className="v2-dream-m-name">{scene.title}</h3>
            </div>
            <div className="v2-dream-m-pic">
              <img src={scene.image} alt={scene.title} />
              <div className="v2-media-vignette" />
              <HotspotLayer hotspots={scene.hotspots} products={products} />
            </div>
          </div>
        ))}

        {remainingCount > 0 && (
          <div className="v2-dream-m-more">
            <button
              type="button"
              onClick={() => setShowAllMobile(true)}
              className="v2-dream-m-remain"
            >
              <span>Còn lại</span>
              <strong>{remainingCount}</strong>
              <span>không gian</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAllMobile(true)}
              aria-label="Xem thêm các không gian còn lại"
              className="v2-dream-m-arrow"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
