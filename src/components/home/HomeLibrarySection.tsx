"use client";

import React from "react";
import Link from "next/link";
import {
  libraryArticles as defaultLibraryArticles,
  type EditorialArticle,
} from "@/data/editorial";
import { DualArrowSvg, MorePill } from "./MorePill";

export function HomeLibrarySection({
  articles = defaultLibraryArticles,
}: {
  articles?: EditorialArticle[];
}) {
  const items = articles.slice(0, 4);

  if (items.length === 0) return null;

  return (
    <section
      className="v2-section is-ink v2-hlib"
      aria-label="Thư viện kiến thức nội thất"
    >
      <div className="v2-hlib-wrap">
        <div className="v2-hlib-head" data-reveal="">
          <h2 className="v2-hlib-title">Thư viện</h2>
          <p className="v2-hlib-desc">
            Kiến thức chọn vật liệu, tỷ lệ không gian và hướng dẫn bảo quản nội thất từ chuyên gia An Gia Decor.
          </p>
          <MorePill href="/thu-vien" label="Xem thêm" />
        </div>

        <div className="v2-hlib-cards">
          {items.map((art) => (
            <Link
              key={art.slug}
              href={`/thu-vien/${art.slug}`}
              className="v2-hlib-card"
              data-reveal=""
            >
              <span className="v2-hlib-pic">
                <img src={art.coverImage} alt={art.title} />
                <span className="v2-hlib-tag">{art.category}</span>
              </span>
              <span className="v2-hlib-name">{art.title}</span>
              <span className="v2-hlib-more">
                <span>Xem thêm</span>
                <span className="v2-bst-more-icon" aria-hidden="true">
                  <DualArrowSvg />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
