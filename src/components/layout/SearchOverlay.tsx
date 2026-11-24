"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, X } from "lucide-react";
import {
  categories as defaultCategories,
  type ProductCategory,
} from "@/data/categories";
import {
  normalizeVi,
  products as defaultProducts,
  type Product,
} from "@/data/products";
import { useUI } from "@/context/UIContext";

const quickKeywords = [
  "Sofa Bắc Âu",
  "Sofa da chống trầy",
  "Bàn trà",
  "Bàn ăn mặt đá",
  "Giường bọc da",
];

function SearchDialog({
  onClose,
  categories,
  products,
}: {
  onClose: () => void;
  categories: ProductCategory[];
  products: Product[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(timer);
  }, []);

  const normalized = useMemo(() => normalizeVi(query), [query]);

  const matchedCategories = useMemo(() => {
    if (!normalized) return categories.slice(0, 4);
    return categories
      .filter((c) =>
        normalizeVi(`${c.title} ${c.groupName} ${c.subcategories.join(" ")}`).includes(
          normalized
        )
      )
      .slice(0, 4);
  }, [categories, normalized]);

  const matchedProducts = useMemo(() => {
    if (!normalized) return products.slice(0, 6);
    return products
      .filter((p) =>
        normalizeVi(`${p.name} ${p.categoryName} ${p.groupName} ${p.description}`).includes(
          normalized
        )
      )
      .slice(0, 10);
  }, [normalized, products]);

  const trimmedQuery = query.trim();
  const allResultsHref = trimmedQuery
    ? `/danh-muc/tat-ca?q=${encodeURIComponent(trimmedQuery)}`
    : "/danh-muc/tat-ca";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeIdx >= 0 && matchedProducts[activeIdx]) {
      router.push(`/san-pham/${matchedProducts[activeIdx].slug}`);
      onClose();
      return;
    }
    router.push(allResultsHref);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((prev) =>
        matchedProducts.length === 0 ? -1 : (prev + 1) % matchedProducts.length
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((prev) =>
        matchedProducts.length === 0
          ? -1
          : prev <= 0
          ? matchedProducts.length - 1
          : prev - 1
      );
    }
  };

  return (
    <div
      className="v2 v2-search is-open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Tìm kiếm sản phẩm"
    >
      <div className="v2-search-box" data-lenis-prevent>
        {/* Input Row */}
        <form onSubmit={handleSubmit} className="v2-search-field">
          <Search className="w-5 h-5 shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIdx(-1);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Tìm sản phẩm: sofa góc, kệ tivi, bàn trang điểm…"
            aria-label="Tìm sản phẩm"
            autoComplete="off"
            role="combobox"
            aria-expanded={matchedProducts.length > 0 || matchedCategories.length > 0}
            aria-controls="v2-search-list"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActiveIdx(-1);
                inputRef.current?.focus();
              }}
              className="text-xs text-[#9c9c9c] hover:text-white px-2 py-1"
            >
              Xóa
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng tìm kiếm"
            className="v2-icon"
          >
            <X className="w-5 h-5" />
          </button>
        </form>

        {/* Quick Chips */}
        <div className="px-5 py-3 flex flex-wrap items-center gap-2 border-b border-white/10 bg-black/15">
          <span className="text-[11px] uppercase tracking-widest text-[#9c9c9c] mr-1">
            Gợi ý:
          </span>
          {quickKeywords.map((kw) => (
            <button
              key={kw}
              type="button"
              onClick={() => {
                setQuery(kw);
                setActiveIdx(-1);
              }}
              className="text-xs px-3 py-1 rounded-full border border-white/15 text-white/85 hover:border-[#e2ad21] hover:text-[#e2ad21] transition-colors"
            >
              {kw}
            </button>
          ))}
        </div>

        {/* Results */}
        <div id="v2-search-list" className="overflow-y-auto p-3 space-y-4">
          <Link
            href={allResultsHref}
            onClick={onClose}
            className="v2-search-all"
          >
            <span>
              {trimmedQuery
                ? `Xem tất cả kết quả cho "${trimmedQuery}"`
                : "Xem toàn bộ Catalogue sản phẩm"}
            </span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </Link>

          {matchedCategories.length > 0 && (
            <div className="px-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#e2ad21] px-2 mb-2">
                Danh mục phù hợp
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {matchedCategories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/danh-muc/${c.slug}`}
                    onClick={onClose}
                    className="flex items-center justify-between px-3 py-2.5 rounded-[10px] bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <span className="text-sm font-semibold text-white">
                      {c.title}
                    </span>
                    <span className="text-xs text-[#9c9c9c]">{c.groupName}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#e2ad21] px-3 mb-1">
              {normalized
                ? `Sản phẩm (${matchedProducts.length})`
                : "Sản phẩm nổi bật"}
            </p>
            {matchedProducts.length === 0 ? (
              <div className="v2-search-empty">
                <p>
                  Không tìm thấy sản phẩm phù hợp với &ldquo;{query}&rdquo;. Thử từ khóa khác như
                  &ldquo;sofa&rdquo;, &ldquo;bàn trà&rdquo; hoặc &ldquo;giường&rdquo;.
                </p>
              </div>
            ) : (
              <ul className="v2-search-list">
                {matchedProducts.map((p, idx) => (
                  <li key={p.slug}>
                    <Link
                      href={`/san-pham/${p.slug}`}
                      onClick={onClose}
                      className={`v2-search-item ${idx === activeIdx ? "is-active" : ""}`}
                    >
                      <img src={p.images[0]} alt={p.name} />
                      <span className="flex-1">
                        <b>{p.name}</b>
                        <small>
                          {p.categoryName} · {p.priceLabel}
                        </small>
                      </span>
                      <ArrowRight className="w-4 h-4 text-[#9c9c9c] shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SearchOverlay({
  categories = defaultCategories,
  products = defaultProducts,
}: {
  categories?: ProductCategory[];
  products?: Product[];
}) {
  const { searchOpen, setSearchOpen } = useUI();
  if (!searchOpen) return null;
  return (
    <SearchDialog
      categories={categories}
      products={products}
      onClose={() => setSearchOpen(false)}
    />
  );
}
