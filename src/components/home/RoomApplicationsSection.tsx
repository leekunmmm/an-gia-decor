"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { roomApplications } from "@/data/homepage";
import type { Product } from "@/data/products";
import { HotspotLayer } from "./HotspotLayer";

export function RoomApplicationsSection({
  products = [],
}: {
  products?: Product[];
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const current = roomApplications[activeIdx];

  const stepRoom = (dir: -1 | 1) => {
    setActiveIdx((prev) => (prev + dir + roomApplications.length) % roomApplications.length);
  };

  return (
    <section
      className="v2-section is-slate v2-space"
      aria-label="Ứng dụng theo từng phòng"
    >
      {/* Blurred Ambient Backdrop */}
      <div className="v2-space-backdrop" aria-hidden="true">
        <img src={current.image} alt="" />
      </div>

      <div className="v2-wrap v2-space-inner">
        <h2 className="v2-space-heading" data-reveal="">
          Ứng dụng chuẩn mực,{" "}
          <span className="is-strong">giá trị lâu dài</span>
        </h2>
        <p className="v2-space-sub" data-reveal="">
          {current.description}
        </p>

        {/* Interactive Hotspot Stage */}
        <div className="v2-space-stage shadow-2xl" data-reveal="">
          <div className="v2-space-stage-media">
            <img
              src={current.image}
              alt={current.label}
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

        {/* Room Filter Pills + Mobile Steppers */}
        <div className="v2-space-switch">
          <button
            type="button"
            onClick={() => stepRoom(-1)}
            aria-label="Không gian trước"
            className="v2-space-step"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            className="v2-space-pills"
            role="tablist"
            aria-label="Chọn không gian phòng"
          >
            {roomApplications.map((room, idx) => (
              <button
                key={room.id}
                type="button"
                role="tab"
                aria-selected={idx === activeIdx}
                onClick={() => setActiveIdx(idx)}
                className={`v2-space-pill ${idx === activeIdx ? "is-active" : ""}`}
              >
                {room.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => stepRoom(1)}
            aria-label="Không gian tiếp theo"
            className="v2-space-step"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
