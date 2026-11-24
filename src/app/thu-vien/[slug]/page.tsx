import "@/styles/pages/library.css";
import type { Metadata } from "next";
import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LibraryArticleShare } from "@/components/editorial/LibraryView";
import {
  getArticleBySlug,
  getArticles,
  getSiteSettings,
} from "@/lib/data-service";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildPageMetadata,
} from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const revalidate = 60;

export async function generateStaticParams() {
  const libraryArticles = await getArticles("library");
  return libraryArticles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [article, settings] = await Promise.all([
    getArticleBySlug("library", slug),
    getSiteSettings(),
  ]);

  if (!article) {
    return {
      title: "Không tìm thấy bài viết",
    };
  }

  return buildPageMetadata({
    title: article.title,
    description: article.excerpt,
    path: `/thu-vien/${article.slug}`,
    image: article.coverImage,
    type: "article",
    siteName: settings.name,
  });
}

export default async function LibraryArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [libraryArticles, settings] = await Promise.all([
    getArticles("library"),
    getSiteSettings(),
  ]);
  const article = libraryArticles.find((a) => a.slug === slug);
  if (!article) {
    notFound();
  }

  const others = libraryArticles.filter((a) => a.slug !== article.slug);
  const sameCategory = others.filter((a) => a.category === article.category);
  const differentCategory = others.filter((a) => a.category !== article.category);
  const related = [...sameCategory, ...differentCategory].slice(0, 3);
  const sourceLabel = article.sourceLabel?.trim() || "";
  const sourceUrl = article.sourceUrl?.trim() || "";

  const articlePath = `/thu-vien/${article.slug}`;
  const breadcrumbs = buildBreadcrumbJsonLd([
    { name: "Trang chủ", path: "/" },
    { name: "Thư viện", path: "/thu-vien" },
    { name: article.title, path: articlePath },
  ]);

  return (
    <div className="v2-news v2-lib-article">
      <JsonLd
        data={[buildArticleJsonLd(article, articlePath, settings), breadcrumbs]}
      />
      <article className="v2-art">
        <nav className="v2-art-trail" aria-label="Đường dẫn">
          <Link href="/">Trang chủ</Link>
          <i aria-hidden="true">|</i>
          <Link href="/thu-vien">Thư viện</Link>
          <i aria-hidden="true">|</i>
          <span>{article.category}</span>
        </nav>

        <header className="v2-art-head" data-reveal="">
          <h1 className="v2-art-title">{article.title}</h1>
          <p className="v2-news-meta v2-art-meta">
            <span className="v2-news-source">{settings.name}</span>
            <span className="v2-news-date">
              {article.date} · {article.readTime}
            </span>
          </p>
        </header>

        <figure className="v2-art-cover" data-reveal="">
          <img src={article.coverImage} alt={article.title} />
          <span className="v2-media-vignette" aria-hidden="true" />
        </figure>

        <div className="v2-art-body" data-reveal="">
          {article.keyPoints && article.keyPoints.length > 0 && (
            <aside className="v2-art-points">
              <h2>Điểm nhấn chính</h2>
              <ul>
                {article.keyPoints.map((pt, idx) => (
                  <li key={idx}>{pt}</li>
                ))}
              </ul>
            </aside>
          )}

          <div className="v2-art-html">
            <p className="v2-art-lead">{article.excerpt}</p>
            {article.sections.map((sec) => (
              <React.Fragment key={sec.heading}>
                <h2>{sec.heading}</h2>
                {sec.paragraphs.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </React.Fragment>
            ))}
          </div>

          {(sourceLabel || sourceUrl) && (
            <div className="v2-art-source">
              {sourceLabel && (
                <p>
                  <strong>Nguồn tham khảo:</strong> {sourceLabel}
                </p>
              )}
              {sourceUrl && (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="v2-more"
                >
                  <span className="v2-more-label">Đọc bài gốc</span>
                  <span className="v2-more-icon" aria-hidden="true">
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
                </a>
              )}
            </div>
          )}
        </div>

        <LibraryArticleShare
          key={article.slug}
          title={article.title}
          slug={article.slug}
        />

        <section className="v2-art-related" data-reveal="">
          <h2 className="v2-art-related-title">Bài viết liên quan</h2>
          <div className="v2-art-related-grid">
            {related.map((item) => (
              <Link
                key={item.slug}
                href={`/thu-vien/${item.slug}`}
                className="v2-art-card"
              >
                <span className="v2-news-pic">
                  <img src={item.coverImage} alt={item.title} />
                  <span className="v2-media-vignette" aria-hidden="true" />
                </span>
                <span className="v2-art-card-title">{item.title}</span>
                <span className="v2-news-meta">
                  <span className="v2-news-source">{settings.name}</span>
                  <span className="v2-news-date">
                    {item.date} · {item.readTime}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </article>
    </div>
  );
}
