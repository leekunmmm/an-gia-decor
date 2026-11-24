"use client";

import React from "react";
import Link from "next/link";
import {
  newsArticles as defaultNewsArticles,
  type EditorialArticle,
} from "@/data/editorial";
import { DualArrowSvg, MorePill } from "./MorePill";

export function HomeNewsSection({
  articles = defaultNewsArticles,
}: {
  articles?: EditorialArticle[];
}) {
  const items = articles.slice(0, 6);

  if (items.length === 0) return null;

  return (
    <section
      className="v2-section is-black v2-hnews"
      aria-label="Tin tức mới nhất"
    >
      <div className="v2-hnews-wrap">
        <div className="v2-hnews-head" data-reveal="">
          <h2 className="v2-hnews-title">Tin tức &amp; Sự kiện</h2>
          <MorePill href="/tin-tuc" label="Xem thêm" />
        </div>

        <div className="v2-hnews-grid">
          {items.map((news) => (
            <Link
              key={news.slug}
              href={`/tin-tuc/${news.slug}`}
              className="v2-hnews-item"
              data-reveal=""
            >
              <span className="v2-hnews-pic">
                <img src={news.coverImage} alt={news.title} />
              </span>

              <span className="v2-hnews-copy">
                <span className="v2-hnews-name">{news.title}</span>
                <span className="v2-hnews-foot">
                  <span className="v2-hnews-cate">{news.category}</span>
                  <span className="v2-hnews-more">
                    <span>Đọc thêm</span>
                    <span className="v2-bst-more-icon" aria-hidden="true">
                      <DualArrowSvg />
                    </span>
                  </span>
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
