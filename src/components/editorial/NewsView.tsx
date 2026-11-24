"use client";

import "@/styles/pages/news.css";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { Copy } from "lucide-react";
import {
  newsArticles as defaultNewsArticles,
  type EditorialArticle,
} from "@/data/editorial";
import { useSiteSettings } from "@/context/SiteSettingsContext";

const INITIAL_COUNT = 6;
const LOAD_STEP = 6;

interface NewsRowChunk {
  big: EditorialArticle;
  smalls: EditorialArticle[];
}

export function NewsView({
  articles = defaultNewsArticles,
}: {
  articles?: EditorialArticle[];
}) {
  const brandConfig = useSiteSettings();
  const [activeTopic, setActiveTopic] = useState("Tất cả");
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

  const topics = useMemo(() => {
    const categories = Array.from(new Set(articles.map((a) => a.category)));
    return ["Tất cả", ...categories];
  }, [articles]);

  const heroTiles = useMemo(() => {
    const heroes = articles.filter((a) => a.isHero);
    return (heroes.length >= 5 ? heroes : articles).slice(0, 5);
  }, [articles]);

  const filtered = useMemo(() => {
    if (activeTopic === "Tất cả") return articles;
    return articles.filter((n) => n.category === activeTopic);
  }, [activeTopic, articles]);

  const visibleArticles = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  );

  const rows = useMemo<NewsRowChunk[]>(() => {
    const chunks: NewsRowChunk[] = [];
    for (let i = 0; i < visibleArticles.length; i += 3) {
      const slice = visibleArticles.slice(i, i + 3);
      if (slice.length > 0) {
        chunks.push({
          big: slice[0],
          smalls: slice.slice(1),
        });
      }
    }
    return chunks;
  }, [visibleArticles]);

  const handleSelectTopic = (topic: string) => {
    setActiveTopic(topic);
    setVisibleCount(INITIAL_COUNT);
  };

  return (
    <div className="v2-news">
      {/* 1. 5-Tile Static Mosaic Hero */}
      <section className="v2-news-hero" aria-label="Tin tức tiêu điểm">
        {heroTiles.map((item, idx) => (
          <Link
            key={item.slug}
            href={`/tin-tuc/${item.slug}`}
            className={`v2-news-tile${idx === 0 ? " is-big" : ""}`}
          >
            <img src={item.coverImage} alt={item.title} />
            <span className="v2-news-cate">{item.category}</span>
            <span className="v2-news-tile-copy">
              <span className="v2-news-tile-title">{item.title}</span>
              <span className="v2-news-meta">
                <span className="v2-news-source">
                  {item.sourceLabel ?? brandConfig.name}
                </span>
                <span className="v2-news-date">{item.date}</span>
              </span>
            </span>
          </Link>
        ))}
      </section>

      {/* 2. Head & Category Filter Tabs */}
      <div className="v2-news-head">
        <p className="v2-news-eyebrow v2-reveal">Tin tức</p>
        <nav className="v2-news-tabs" aria-label="Chủ đề tin">
          {topics.map((topic) => {
            const isActive = activeTopic === topic;
            return (
              <button
                key={topic}
                type="button"
                className={isActive ? "is-active" : undefined}
                aria-pressed={isActive}
                onClick={() => handleSelectTopic(topic)}
              >
                <span className="v2-roll">
                  <span>{topic}</span>
                  <span aria-hidden="true">{topic}</span>
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 3. Alternating Asymmetric Rows & Load-More */}
      <section className="v2-news-list" aria-label="Danh sách tin tức">
        {rows.map(({ big, smalls }, rowIdx) => (
          <div
            key={`${activeTopic}-${big.slug}`}
            className={`v2-news-row${rowIdx % 2 === 1 ? " is-flip" : ""}${
              smalls.length === 0 ? " is-single" : ""
            }`}
          >
            <div className="v2-reveal" key={`big-${activeTopic}-${big.slug}`}>
              <Link
                className="v2-news-card is-big"
                href={`/tin-tuc/${big.slug}`}
              >
                <span className="v2-news-pic">
                  <img
                    src={big.coverImage}
                    alt={big.title}
                    loading="lazy"
                  />
                  <span className="v2-news-cate">{big.category}</span>
                </span>
                <span className="v2-news-text">
                  <span className="v2-news-title">{big.title}</span>
                  <span className="v2-news-meta">
                    <span className="v2-news-source">
                      {big.sourceLabel ?? brandConfig.name}
                    </span>
                    <span className="v2-news-date">{big.date}</span>
                  </span>
                </span>
              </Link>
            </div>

            {smalls.length > 0 && (
              <div className="v2-news-smalls">
                {smalls.map((item) => (
                  <div
                    className="v2-reveal"
                    key={`small-${activeTopic}-${item.slug}`}
                  >
                    <Link
                      className="v2-news-card is-small"
                      href={`/tin-tuc/${item.slug}`}
                    >
                      <span className="v2-news-pic">
                        <img
                          src={item.coverImage}
                          alt={item.title}
                          loading="lazy"
                        />
                      </span>
                      <span className="v2-news-text">
                        <span className="v2-news-title">{item.title}</span>
                        <span className="v2-news-excerpt">{item.excerpt}</span>
                        <span className="v2-news-meta">
                          <span className="v2-news-source">
                            {item.sourceLabel ?? brandConfig.name}
                          </span>
                          <span className="v2-news-date">{item.date}</span>
                        </span>
                      </span>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {visibleCount < filtered.length && (
          <div className="v2-news-more">
            <button
              type="button"
              className="v2-more"
              onClick={() => setVisibleCount((c) => c + LOAD_STEP)}
            >
              <span className="v2-more-label">Xem thêm</span>
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
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

const emptySubscribe = () => () => {};

export function NewsArticleShare({
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
    () => `https://${brandConfig.domain}/tin-tuc/${slug}`
  );
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    const targetUrl =
      typeof window !== "undefined" ? window.location.href : shareUrl;
    let success = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(targetUrl);
        success = true;
      }
    } catch {
      success = false;
    }

    if (!success && typeof document !== "undefined") {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = targetUrl;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        success = document.execCommand("copy");
        document.body.removeChild(textarea);
      } catch {
        success = false;
      }
    }

    if (success) {
      setCopied(true);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        setCopied(false);
      }, 2500);
    }
  };

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div className="v2-art-share">
      <span>Chia sẻ</span>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chia sẻ lên Facebook"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
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
        href={`https://sp.zalo.me/share_inline?url=${encodedUrl}&title=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chia sẻ qua Zalo"
      >
        Zalo
      </a>
      <button
        type="button"
        aria-label="Sao chép liên kết"
        onClick={handleCopy}
      >
        <Copy size={15} aria-hidden="true" />
      </button>
      {copied && <small role="status">Đã sao chép liên kết</small>}
    </div>
  );
}
