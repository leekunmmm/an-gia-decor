"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  categories as defaultCategories,
  type ProductCategory,
} from "@/data/categories";
import { useUI } from "@/context/UIContext";
import { BrandLogo } from "./BrandLogo";

function RollSpan({ text }: { text: string }) {
  return (
    <span className="v2-roll">
      <span>{text}</span>
      <span aria-hidden="true">{text}</span>
    </span>
  );
}

export function MegaMenu({
  categories = defaultCategories,
}: {
  categories?: ProductCategory[];
}) {
  const { megaOpen, setMegaOpen } = useUI();
  const [activeSlug, setActiveSlug] = useState(categories[0]?.slug ?? "");
  const [mobileStep, setMobileStep] = useState<"rooms" | "items">("rooms");

  useEffect(() => {
    if (!megaOpen) {
      const t = setTimeout(() => setMobileStep("rooms"), 0);
      return () => clearTimeout(t);
    }
  }, [megaOpen]);

  if (!megaOpen) return null;

  const activeCategory =
    categories.find((c) => c.slug === activeSlug) || categories[0];

  if (!activeCategory) return null;

  return (
    <div
      id="v2-products-menu"
      className="v2-mega"
      data-step={mobileStep}
      role="dialog"
      aria-modal="true"
      aria-label="Danh mục sản phẩm"
    >
      {/* Top Bar */}
      <div className="v2-mega-bar">
        <span className="v2-mega-heading">Sản phẩm</span>
        <div className="v2-mega-logo flex justify-center">
          <BrandLogo compact size="sm" />
        </div>
        <button
          type="button"
          onClick={() => setMegaOpen(false)}
          className="v2-mega-close"
          aria-label="Đóng danh mục sản phẩm"
        >
          <span>Đóng</span>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 3-Column Body (collapses to 2-step drilldown <= 1099px) */}
      <div className="v2-mega-body">
        {/* Left: Categories (~39) */}
        <ul className="v2-mega-rooms" data-lenis-prevent>
          {categories.map((cat) => {
            const active = cat.slug === activeCategory.slug;
            return (
              <li key={cat.slug} className={active ? "is-active" : ""}>
                <button
                  type="button"
                  onMouseEnter={() => setActiveSlug(cat.slug)}
                  onFocus={() => setActiveSlug(cat.slug)}
                  onClick={() => {
                    setActiveSlug(cat.slug);
                    setMobileStep("items");
                  }}
                >
                  <RollSpan text={cat.title} />
                  <ChevronRight className="w-4 h-4 opacity-60 shrink-0" />
                </button>
              </li>
            );
          })}
        </ul>

        {/* Middle: Subcategories & All link */}
        <div className="v2-mega-items" data-lenis-prevent>
          <button
            type="button"
            onClick={() => setMobileStep("rooms")}
            className="v2-mega-back"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Quay lại danh mục ({activeCategory.title})</span>
          </button>

          <ol key={activeCategory.slug}>
            <li>
              <Link
                href={`/danh-muc/${activeCategory.slug}`}
                onClick={() => setMegaOpen(false)}
                className="v2-mega-item-link font-semibold"
              >
                <span className="v2-mega-number">01.</span>
                <RollSpan text={`Xem tất cả ${activeCategory.title}`} />
              </Link>
            </li>

            {activeCategory.subcategories.map((sub, idx) => (
              <li key={sub}>
                <Link
                  href={`/danh-muc/${activeCategory.slug}`}
                  onClick={() => setMegaOpen(false)}
                  className="v2-mega-item-link"
                >
                  <span className="v2-mega-number">
                    {String(idx + 2).padStart(2, "0")}.
                  </span>
                  <RollSpan text={sub} />
                </Link>
              </li>
            ))}

            <li>
              <Link
                href="/danh-muc/tat-ca"
                onClick={() => setMegaOpen(false)}
                className="v2-mega-item-link bg-[#e9e9e9]"
              >
                <span className="v2-mega-number">→</span>
                <RollSpan text="Toàn bộ Catalogue sản phẩm" />
              </Link>
            </li>
          </ol>
        </div>

        {/* Right: Live Preview Picture */}
        <div className="v2-mega-picture">
          <img
            src={activeCategory.previewImage}
            alt={activeCategory.title}
            className="w-full h-full object-cover transition-all duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8 text-white">
            <span className="v2-eyebrow">{activeCategory.groupName}</span>
            <h3 className="text-3xl font-semibold uppercase tracking-wide mt-2">
              {activeCategory.title}
            </h3>
            <p className="text-sm text-[#cccccc] max-w-lg mt-2 leading-relaxed">
              {activeCategory.description}
            </p>
            <Link
              href={`/danh-muc/${activeCategory.slug}`}
              onClick={() => setMegaOpen(false)}
              className="v2-pill mt-5"
            >
              <span>Khám phá {activeCategory.title}</span>
              <ArrowRight className="w-4 h-4 v2-arrow" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
