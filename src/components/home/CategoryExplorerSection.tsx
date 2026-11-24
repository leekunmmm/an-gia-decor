"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { productGroups, type ProductCategory } from "@/data/categories";
import type { CategoryExplorerTab } from "@/data/homepage";
import { DualArrowSvg } from "./MorePill";

export function CategoryExplorerSection({
  categories = [],
}: {
  categories?: ProductCategory[];
}) {
  const tabs: CategoryExplorerTab[] = useMemo(() => {
    return productGroups
      .map((group) => {
        const groupCats = categories.filter((c) => c.groupId === group.id);
        if (groupCats.length === 0) return null;

        const sliced = groupCats.slice(0, 11);
        const items = [
          ...sliced.map((c, idx) => ({
            number: `${String(idx + 1).padStart(2, "0")}.`,
            title: c.title,
            slug: c.slug,
            image: c.previewImage || c.bannerImage || "/images/room-living.jpg",
          })),
          {
            number: `${String(sliced.length + 1).padStart(2, "0")}.`,
            title: `Xem tất cả ${group.name}`,
            slug: group.id,
            image:
              sliced[0]?.bannerImage ||
              sliced[0]?.previewImage ||
              "/images/room-living.jpg",
          },
        ];

        return {
          groupId: group.id,
          label: group.name,
          items,
        } satisfies CategoryExplorerTab;
      })
      .filter((t): t is CategoryExplorerTab => Boolean(t));
  }, [categories]);

  const [tabIdx, setTabIdx] = useState(0);
  const [hoverIdx, setHoverIdx] = useState(0);

  if (tabs.length === 0) return null;

  const safeTabIdx = tabIdx < tabs.length ? tabIdx : 0;
  const activeTab = tabs[safeTabIdx];
  const activeItem = activeTab.items[hoverIdx] || activeTab.items[0];

  const handleTabChange = (idx: number) => {
    setTabIdx(idx);
    setHoverIdx(0);
  };

  return (
    <section
      className="v2-section is-ink v2-catx"
      aria-label="Tìm hiểu sản phẩm theo danh mục"
    >
      <div className="v2-wrap">
        <h2 className="v2-title" data-reveal="">
          Tìm hiểu sản phẩm theo danh mục
        </h2>

        {/* Group Tabs */}
        <div className="v2-catx-tabs" role="tablist">
          {tabs.map((tab, idx) => (
            <button
              key={tab.groupId}
              type="button"
              role="tab"
              aria-selected={idx === safeTabIdx}
              onClick={() => handleTabChange(idx)}
              className={`v2-catx-tab ${idx === safeTabIdx ? "is-active" : ""}`}
            >
              <span className="v2-catx-tab-inner">
                <span className="is-normal">{tab.label}</span>
                <span className="is-hover" aria-hidden="true">
                  {tab.label}
                </span>
              </span>
            </button>
          ))}
        </div>

        <div className="v2-catx-grid">
          <ol className="v2-catx-list">
            {activeTab.items.map((item, idx) => {
              const active = idx === hoverIdx;
              return (
                <li
                  key={`${activeTab.groupId}-${item.slug}-${item.number}`}
                  className={`v2-catx-row ${active ? "is-active" : ""}`}
                >
                  <Link
                    href={`/danh-muc/${item.slug}`}
                    onMouseEnter={() => setHoverIdx(idx)}
                    onFocus={() => setHoverIdx(idx)}
                  >
                    <span className="v2-catx-number">{item.number}</span>
                    <span className="v2-catx-name truncate pr-2">{item.title}</span>
                    <span className="v2-catx-arrow" aria-hidden="true">
                      <DualArrowSvg />
                    </span>
                    <span className="v2-catx-thumb" aria-hidden="true">
                      <img src={item.image} alt="" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>

          <div className="v2-catx-picture">
            <div className="v2-catx-media">
              {activeTab.items.map((item, idx) => (
                <div
                  key={`${activeTab.groupId}-pic-${item.slug}-${item.number}`}
                  className={`v2-catx-pic ${idx === hoverIdx ? "is-active" : ""}`}
                >
                  <img src={item.image} alt={item.title} />
                </div>
              ))}
            </div>

            <div className="v2-catx-pic-head is-active">
              <h3 className="v2-catx-pic-title">{activeItem.title}</h3>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
