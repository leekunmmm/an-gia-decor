import "@/styles/pages/news.css";
import type { Metadata } from "next";
import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
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
import { NewsArticleShare } from "@/components/editorial/NewsView";

export const revalidate = 60;

export async function generateStaticParams() {
  const newsArticles = await getArticles("news");
  return newsArticles.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [article, settings] = await Promise.all([
    getArticleBySlug("news", slug),
    getSiteSettings(),
  ]);
  if (!article) {
    return {
      title: "Bài viết không tồn tại",
    };
  }
  return buildPageMetadata({
    title: article.title,
    description: article.excerpt,
    path: `/tin-tuc/${article.slug}`,
    image: article.coverImage,
    type: "article",
    siteName: settings.name,
  });
}

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [newsArticles, settings] = await Promise.all([
    getArticles("news"),
    getSiteSettings(),
  ]);
  const article = newsArticles.find((a) => a.slug === slug);
  if (!article) {
    notFound();
  }

  const related = newsArticles
    .filter((n) => n.slug !== article.slug)
    .slice(0, 3);

  const sourceName = article.sourceLabel ?? settings.name;
  const articlePath = `/tin-tuc/${article.slug}`;
  const breadcrumbs = buildBreadcrumbJsonLd([
    { name: "Trang chủ", path: "/" },
    { name: "Tin tức", path: "/tin-tuc" },
    { name: article.title, path: articlePath },
  ]);

  return (
    <div className="v2-news">
      <JsonLd
        data={[buildArticleJsonLd(article, articlePath, settings), breadcrumbs]}
      />
      <article className="v2-art">
        <p className="v2-art-trail">
          <Link href="/tin-tuc">Tin tức</Link>
          <i>|</i>
          <span>{article.category}</span>
        </p>

        <header className="v2-art-head">
          <h1 className="v2-art-title">{article.title}</h1>
          <p className="v2-news-meta v2-art-meta">
            <span className="v2-news-source">{sourceName}</span>
            <span className="v2-news-date">{article.date}</span>
            <span>{article.readTime}</span>
          </p>
        </header>

        <figure className="v2-art-cover">
          <img src={article.coverImage} alt={article.title} />
        </figure>

        <div className="v2-art-body">
          <p className="v2-art-lead">{article.excerpt}</p>

          {article.keyPoints && article.keyPoints.length > 0 && (
            <section className="v2-art-points">
              <h2>Điểm chính</h2>
              <ul>
                {article.keyPoints.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
            </section>
          )}

          {article.sections.map((sec) => (
            <React.Fragment key={sec.heading}>
              <h2>{sec.heading}</h2>
              {sec.paragraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </React.Fragment>
          ))}

          {(article.sourceUrl || article.sourceLabel) && (
            <aside className="v2-art-source">
              <p>
                Bài viết được {settings.name} biên tập từ{" "}
                <strong>{sourceName}</strong>.
              </p>
              {article.sourceUrl && (
                <a
                  className="v2-more"
                  href={article.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="v2-more-label">Đọc bài gốc</span>
                  <span className="v2-more-icon" aria-hidden="true">
                    <ArrowUpRight size={16} />
                  </span>
                </a>
              )}
            </aside>
          )}
        </div>

        <NewsArticleShare title={article.title} slug={article.slug} />

        <section className="v2-art-related">
          <h2 className="v2-art-related-title">Tin liên quan</h2>
          <div className="v2-art-related-grid">
            {related.map((item) => (
              <Link
                key={item.slug}
                href={`/tin-tuc/${item.slug}`}
                className="v2-art-card"
              >
                <span className="v2-news-pic">
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    loading="lazy"
                  />
                </span>
                <span className="v2-art-card-title">{item.title}</span>
                <span className="v2-news-meta">
                  <span className="v2-news-date">{item.date}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </article>
    </div>
  );
}
