import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import {
  getCategories,
  getCollectionBySlug,
  getCollections,
  getProducts,
  getSiteSettings,
} from "@/lib/data-service";
import { buildBreadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import "@/styles/pages/collection.css";
import { CollectionParallax } from "../CollectionParallax";
import { renderSplitChars } from "../splitText";
import {
  CollectionContactChannels,
  CollectionGallery,
} from "./CollectionDetailClient";

export const revalidate = 60;

export async function generateStaticParams() {
  const collections = await getCollections();
  return collections.map((col) => ({ slug: col.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [col, settings] = await Promise.all([
    getCollectionBySlug(slug),
    getSiteSettings(),
  ]);
  if (!col) return {};
  return buildPageMetadata({
    title: col.title,
    description: col.subtitle,
    path: `/bo-suu-tap/${col.slug}`,
    image: col.image,
    siteName: settings.name,
  });
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [collections, allCategories, allProducts] = await Promise.all([
    getCollections(),
    getCategories(),
    getProducts(),
  ]);

  const colIndex = collections.findIndex((c) => c.slug === slug);
  if (colIndex === -1) {
    notFound();
  }

  const col = collections[colIndex];
  const categorySlug = col.href.replace(/^\/danh-muc\//, "");
  const category = allCategories.find((c) => c.slug === categorySlug);
  const matchingProducts = allProducts.filter(
    (p) => p.categorySlug === categorySlug
  );

  const galleryImages = Array.from(
    new Set(
      [
        col.image,
        ...(col.hoverImage ? [col.hoverImage] : []),
        ...matchingProducts.flatMap((p) => p.images),
      ].filter(Boolean)
    )
  ).slice(0, 6);

  const relatedCollections = [
    collections[(colIndex + 1) % collections.length],
    collections[(colIndex + 2) % collections.length],
  ].filter((c) => c.slug !== col.slug);

  return (
    <div className="v2-bstd">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Trang chủ", path: "/" },
          { name: "Bộ sưu tập", path: "/bo-suu-tap" },
          { name: col.title, path: `/bo-suu-tap/${col.slug}` },
        ])}
      />
      <CollectionParallax />

      <section className="v2-pd-banner">
        <img
          src={col.image}
          alt=""
          aria-hidden="true"
          className="v2-pd-banner-bg"
        />
        <div className="v2-wrap v2-pd-banner-copy">
          <p className="v2-pd-banner-eyebrow">Bộ sưu tập</p>
          <div
            aria-hidden="true"
            className="v2-split is-chars is-alternate v2-pd-banner-title"
            style={{ "--split-delay": "0.3s" } as React.CSSProperties}
          >
            {renderSplitChars(col.title)}
          </div>
        </div>
      </section>

      <section className="v2-pd-main">
        <div className="v2-pd-wrap">
          <nav className="v2-bstd-crumbs" aria-label="Đường dẫn bộ sưu tập">
            <Link href="/">Trang chủ</Link>
            <span aria-hidden="true">/</span>
            <Link href="/bo-suu-tap">Bộ sưu tập</Link>
            <span aria-hidden="true">/</span>
            <span>{col.title}</span>
          </nav>

          <h1
            aria-label={col.title}
            className="v2-split is-chars is-fade v2-pd-title"
          >
            {renderSplitChars(col.title)}
          </h1>
          <p className="v2-pd-code">
            {col.eyebrow} · {col.itemCount} thiết kế
            {category ? ` · ${category.groupName}` : ""}
          </p>

          <div className="v2-pd-layout v2-bstd-layout">
            <CollectionGallery
              key={col.slug}
              images={galleryImages}
              title={col.title}
              slug={col.slug}
            />

            <aside className="v2-bstd-side">
              <p className="v2-bstd-summary">{col.subtitle}</p>
              {category && (
                <p className="v2-bstd-desc-note">{category.description}</p>
              )}

              <Link href={col.href} className="v2-bstd-catalog-cta">
                <span>
                  Khám phá danh mục {category?.title ?? col.title}
                </span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>

              <div className="v2-bstd-ask">
                <p>
                  Liên hệ kiến trúc sư An Gia Decor để tùy chỉnh kích thước, chất
                  liệu da/vải và nhận báo giá chi tiết:
                </p>
                <CollectionContactChannels />
              </div>
            </aside>
          </div>

          {matchingProducts.length > 0 && (
            <div className="v2-bstd-body">
              <div className="v2-bstd-article">
                <h2>Thiết kế thuộc dòng {category?.title ?? col.title}</h2>
                <p>
                  Các mẫu nội thất tuyển chọn dưới đây kế thừa trọn vẹn bảng vật
                  liệu và tỷ lệ của bộ sưu tập {col.title}, sẵn sàng đặt đóng
                  theo diện tích thực tế.
                </p>

                <div className="v2-bstd-products">
                  {matchingProducts.map((product) => (
                    <Link
                      key={product.slug}
                      href={`/san-pham/${product.slug}`}
                      className="v2-bstd-product-card"
                    >
                      <div className="v2-bstd-product-pic">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      <div className="v2-bstd-product-meta">
                        <h3 className="v2-bstd-product-title">
                          {product.name}
                        </h3>
                        <span className="v2-bstd-product-price">
                          {product.priceLabel}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="v2-bstd-more" aria-label="Bộ sưu tập khác">
        <div className="v2-pd-wrap v2-bstd-more-head">
          <h2>Bộ sưu tập khác</h2>
          <Link href="/bo-suu-tap" className="v2-pill">
            Xem tất cả
          </Link>
        </div>

        <div className="v2-bst-list">
          <div className="v2-bst-row">
            {relatedCollections.map((rel, idx) => (
              <article
                key={rel.slug}
                className="v2-bst-card"
                style={{ "--order": idx } as React.CSSProperties}
              >
                <Link href={`/bo-suu-tap/${rel.slug}`} className="v2-bst-link">
                  <div className="v2-bst-pic">
                    <div className="v2-parallax v2-bst-media">
                      <div className="v2-parallax-inner">
                        <img
                          src={rel.image}
                          alt={rel.title}
                          loading="lazy"
                          decoding="async"
                        />
                        {rel.hoverImage && (
                          <img
                            src={rel.hoverImage}
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
                      <p className="v2-bst-kind">{rel.eyebrow}</p>
                      <h2>{rel.title}</h2>
                      <p className="v2-bst-text">{rel.subtitle}</p>
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
        </div>
      </section>
    </div>
  );
}
