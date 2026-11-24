"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sofa } from "lucide-react";
import type { HotspotItem } from "@/data/homepage";
import type { Product } from "@/data/products";

interface HotspotLayerProps {
  hotspots: HotspotItem[];
  products?: Product[];
}

export function HotspotLayer({ hotspots, products = [] }: HotspotLayerProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const resolvedHotspots = useMemo(() => {
    return hotspots.map((spot) => {
      const liveProduct = products.find((p) => p.slug === spot.productSlug);
      if (liveProduct) {
        return {
          ...spot,
          productName: liveProduct.name,
          categoryName: liveProduct.categoryName,
          priceLabel: liveProduct.priceLabel,
          image: liveProduct.images[0] || spot.image,
          href: `/san-pham/${liveProduct.slug}`,
        };
      }
      return {
        ...spot,
        href: products.length === 0 ? `/san-pham/${spot.productSlug}` : "/danh-muc/tat-ca",
      };
    });
  }, [hotspots, products]);

  const activeOpenId =
    openId && resolvedHotspots.some((spot) => spot.id === openId)
      ? openId
      : null;

  useEffect(() => {
    if (!activeOpenId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenId(null);
        if (
          document.activeElement instanceof HTMLElement &&
          rootRef.current?.contains(document.activeElement)
        ) {
          document.activeElement.blur();
        }
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpenId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [activeOpenId]);

  return (
    <div ref={rootRef} className="v2-hotspots">
      {resolvedHotspots.map((spot, idx) => {
        const isOpen = activeOpenId === spot.id;
        const pinAlign =
          spot.x <= 18 ? "left" : spot.x >= 82 ? "right" : "center";
        const pinY = spot.y <= 18 ? "below" : "above";
        const side = spot.y < 46 ? "below" : "above";
        const align =
          spot.x <= 38 ? "start" : spot.x >= 62 ? "end" : "center";

        return (
          <div
            key={spot.id}
            style={
              {
                left: `${spot.x}%`,
                top: `${spot.y}%`,
                "--hotspot-index": idx,
              } as React.CSSProperties
            }
            data-pin-align={pinAlign}
            data-pin-y={pinY}
            className={`v2-hotspot ${isOpen ? "is-open" : ""}`}
            onMouseEnter={() => setOpenId(spot.id)}
            onMouseLeave={() =>
              setOpenId((prev) => (prev === spot.id ? null : prev))
            }
          >
            <Link
              href={spot.href}
              onFocus={() => setOpenId(spot.id)}
              aria-label={`Xem chi tiết ${spot.productName}`}
              className="v2-hotspot-pin"
            >
              <span className="v2-hotspot-dot" aria-hidden="true" />
              <span className="v2-hotspot-label">
                <span className="v2-hotspot-icon" aria-hidden="true">
                  <Sofa className="w-4 h-4" />
                </span>
                <span>{spot.label}</span>
              </span>
            </Link>

            <div
              className="v2-hotspot-card"
              data-side={side}
              data-align={align}
            >
              <div className="aspect-[4/3] rounded-[10px] overflow-hidden bg-[#292d34]">
                <img
                  src={spot.image}
                  alt={spot.productName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-between py-0.5 min-w-0">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#e2ad21]">
                    {spot.categoryName}
                  </p>
                  <p className="text-xs font-semibold text-white line-clamp-2 mt-1">
                    {spot.productName}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-2 mt-2">
                  <span className="text-[11px] text-[#cccccc]">
                    {spot.priceLabel}
                  </span>
                  <Link
                    href={spot.href}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#e2ad21] hover:underline whitespace-nowrap"
                  >
                    <span>Xem</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
