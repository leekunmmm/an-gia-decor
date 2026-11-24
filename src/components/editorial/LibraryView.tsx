"use client";

import "@/styles/pages/library.css";
import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Copy, Check } from "lucide-react";
import {
  libraryArticles as defaultLibraryArticles,
  type EditorialArticle,
} from "@/data/editorial";
import { useSiteSettings } from "@/context/SiteSettingsContext";

const emptySubscribe = () => () => {};

export function LibraryView({
  articles = defaultLibraryArticles,
}: {
  articles?: EditorialArticle[];
}) {
  const brandConfig = useSiteSettings();
  const featured = articles[0];

  if (!featured) {
    return (
      <div className="v2-news v2-lib">
        <div className="v2-news-head">
          <p className="v2-news-eyebrow">Thư viện</p>
          <p className="v2-cat-empty">Chưa có bài viết trong thư viện.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="v2-news v2-lib">
      {/* Featured Editorial Hero */}
      <section className="v2-lib-hero">
        <img src={featured.coverImage} alt={featured.title} />
        <span className="v2-media-vignette" aria-hidden="true" />
        <div className="v2-lib-hero-copy">
          <span className="v2-news-cate">{featured.category}</span>
          <h1 className="v2-lib-hero-title">{featured.title}</h1>
          <div>
            <Link className="v2-more" href={`/thu-vien/${featured.slug}`}>
              <span className="v2-more-label">Đọc bài viết</span>
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
            </Link>
          </div>
        </div>
      </section>

      {/* Section Heading */}
      <div className="v2-news-head">
        <p className="v2-news-eyebrow">Thư viện</p>
      </div>

      {/* 80vw 3-Column 16:9 Grid */}
      <section className="v2-lib-grid">
        {articles.map((art, idx) => (
          <div
            className="v2-reveal"
            key={art.slug}
            style={{ transitionDelay: `${Math.min(idx, 5) * 60}ms` }}
          >
            <Link className="v2-lib-card" href={`/thu-vien/${art.slug}`}>
              <span className="v2-news-pic">
                <img src={art.coverImage} alt={art.title} />
                <span className="v2-media-vignette" aria-hidden="true" />
                <span className="v2-news-cate">{art.category}</span>
              </span>
              <span className="v2-lib-card-title">{art.title}</span>
              <span className="v2-news-excerpt">{art.excerpt}</span>
              <span className="v2-news-meta">
                <span className="v2-news-source">{brandConfig.name}</span>
                <span className="v2-news-date">
                  {art.date} · {art.readTime}
                </span>
              </span>
            </Link>
          </div>
        ))}
      </section>
    </div>
  );
}

export function LibraryArticleShare({
  title,
  slug,
}: {
  title: string;
  slug: string;
}) {
  const brandConfig = useSiteSettings();
  const shareUrl = useSyncExternalStore(
    emptySubscribe,
    () => window.location.href,
    () => `https://${brandConfig.domain}/thu-vien/${slug}`
  );
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    let success = false;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        success = true;
      } catch {
        success = false;
      }
    }

    if (!success) {
      let textarea: HTMLTextAreaElement | null = null;
      try {
        textarea = document.createElement("textarea");
        textarea.value = shareUrl;
        textarea.readOnly = true;
        textarea.style.position = "fixed";
        textarea.style.top = "0";
        textarea.style.left = "0";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        success = Boolean(document.execCommand("copy"));
      } catch {
        success = false;
      } finally {
        if (textarea && textarea.parentNode) {
          textarea.parentNode.removeChild(textarea);
        }
      }
    }

    if (!success || !isMountedRef.current) {
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setCopied(true);
    timerRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setCopied(false);
      }
    }, 2500);
  };

  return (
    <div className="v2-art-share">
      <span>Chia sẻ</span>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          shareUrl
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Chia sẻ "${title}" lên Facebook`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      </a>
      <a
        className="v2-art-zalo"
        href={`https://zalo.me/share?url=${encodeURIComponent(shareUrl)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Chia sẻ "${title}" qua Zalo`}
      >
        Zalo
      </a>
      <button
        type="button"
        onClick={handleCopy}
        data-copied={copied ? "true" : "false"}
        className={copied ? "is-copied" : undefined}
        aria-label={copied ? "Đã sao chép liên kết" : "Sao chép liên kết"}
      >
        {copied ? (
          <>
            <Check size={15} aria-hidden="true" />
            <span>Đã sao chép</span>
          </>
        ) : (
          <Copy size={15} aria-hidden="true" />
        )}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? "Đã sao chép liên kết bài viết" : ""}
      </span>
    </div>
  );
}
