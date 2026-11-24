import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getCollections, getSiteSettings } from "@/lib/data-service";
import { buildBreadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import "@/styles/pages/collection.css";
import { CollectionParallax } from "./CollectionParallax";
import { renderSplitChars } from "./splitText";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildPageMetadata({
    title: "Bộ sưu tập nội thất",
    description: `Khám phá các bộ sưu tập nội thất tuyển chọn của ${settings.name}: Nordic Whisper, Atelier Noir, Emerald Lounge, Kyoto Timber, Culinary Monolith và Serene Suite.`,
    path: "/bo-suu-tap",
    image: "/images/hero-leather.jpg",
    siteName: settings.name,
  });
}

export default async function CollectionsPage() {
  const collections = await getCollections();
  const pairs: (typeof collections)[] = [];
  for (let i = 0; i < collections.length; i += 2) {
    pairs.push(collections.slice(i, i + 2));
  }

  return (
    <div className="v2-bst">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Trang chủ", path: "/" },
          { name: "Bộ sưu tập", path: "/bo-suu-tap" },
        ])}
      />
      <CollectionParallax />

      <section className="v2-pd-banner v2-bst-banner">
        <img
          src={collections[0]?.image ?? "/images/sofa-nordic.jpg"}
          alt=""
          aria-hidden="true"
          className="v2-pd-banner-bg"
        />
        <div className="v2-wrap v2-pd-banner-copy">
          <p className="v2-pd-banner-eyebrow">Khám phá</p>
          <h1
            aria-label="Các bộ sưu tập"
            className="v2-split is-chars is-alternate v2-pd-banner-title"
            style={{ "--split-delay": "0.3s" } as React.CSSProperties}
          >
            {renderSplitChars("Các bộ sưu tập")}
          </h1>
        </div>
      </section>

      <section className="v2-bst-list" aria-label="Bộ sưu tập">
        {pairs.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className={`v2-bst-row ${rowIdx % 2 === 1 ? "is-dark" : ""}`}
          >
            {row.map((col, idx) => (
              <article
                key={col.slug}
                className="v2-bst-card"
                style={{ "--order": idx } as React.CSSProperties}
              >
                <Link href={`/bo-suu-tap/${col.slug}`} className="v2-bst-link">
                  <div className="v2-bst-pic">
                    <div className="v2-parallax v2-bst-media">
                      <div className="v2-parallax-inner">
                        <img
                          src={col.image}
                          alt={col.title}
                          loading={rowIdx === 0 ? "eager" : "lazy"}
                          decoding="async"
                        />
                        {col.hoverImage && (
                          <img
                            src={col.hoverImage}
                            alt=""
                            aria-hidden="true"
                            className="is-hover"
                            loading="lazy"
                            decoding="async"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="v2-bst-content">
                    <div className="v2-bst-title">
                      <p className="v2-bst-kind">{col.eyebrow}</p>
                      <h2>{col.title}</h2>
                      <p className="v2-bst-text">{col.subtitle}</p>
                    </div>

                    <span className="v2-bst-more">
                      Khám phá ngay
                      <span className="v2-bst-more-icon" aria-hidden="true">
                        <svg viewBox="0 0 100 100" focusable="false">
                          <path
                            className="v2-more-arrow is-out"
                            fill="currentColor"
                            d="M52,28 45.5,29.8 60,47 29.4,47 29.4,53 60,53 45.5,70.1 52,72 70.6,50"
                          />
                          <path
                            className="v2-more-arrow is-in"
                            fill="currentColor"
                            d="M52,28 45.5,29.8 60,47 29.4,47 29.4,53 60,53 45.5,70.1 52,72 70.6,50"
                          />
                        </svg>
                      </span>
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        ))}
      </section>
    </div>
  );
}
