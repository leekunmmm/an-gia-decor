"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ChevronDown, Filter, Search, X } from "lucide-react";
import {
  categories as defaultCategories,
  productGroups,
  type ProductCategory,
  type ProductGroupId,
} from "@/data/categories";
import {
  normalizeVi,
  products as defaultProducts,
  type Product,
} from "@/data/products";
import { useUI } from "@/context/UIContext";
import "@/styles/pages/catalog.css";

const CATEGORY_PAGE_SIZE = 24;

interface CategoryCatalogViewProps {
  initialSlug: string;
  activeCategory?: ProductCategory;
  pageTitle: string;
  pageDescription: string;
  bannerImage: string;
  categories?: ProductCategory[];
  products?: Product[];
}

function computeDefaultSlugs(
  initialSlug: string,
  cats: ProductCategory[]
): string[] {
  if (initialSlug === "tat-ca" || initialSlug === "all") return [];
  const isGroup = productGroups.some((g) => g.id === initialSlug);
  if (isGroup) {
    return cats.filter((c) => c.groupId === initialSlug).map((c) => c.slug);
  }
  return [initialSlug];
}

function sameSlugSelection(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((item) => setA.has(item));
}

function normalizeSearch(input: string): string {
  return normalizeVi(input).replace(/\s+/g, " ");
}

function splitWordsWithOffsets(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const result: { word: string; chars: { ch: string; index: number }[] }[] = [];
  let offset = 0;
  for (const word of words) {
    const chars = Array.from(word).map((ch, idx) => ({
      ch,
      index: offset + idx,
    }));
    offset += chars.length;
    result.push({ word, chars });
  }
  return result;
}

function SplitWordsContent({ text }: { text: string }) {
  const words = useMemo(() => splitWordsWithOffsets(text), [text]);
  return (
    <>
      {words.map((item, wIdx) => (
        <React.Fragment key={`${item.word}-${wIdx}`}>
          {wIdx > 0 && " "}
          <span
            aria-hidden="true"
            className="v2-split-word"
            style={{ "--word-index": wIdx } as React.CSSProperties}
          >
            {item.chars.map((charObj) => (
              <span
                key={charObj.index}
                className="v2-split-char"
                style={{ "--char-index": charObj.index } as React.CSSProperties}
              >
                {charObj.ch}
              </span>
            ))}
          </span>
        </React.Fragment>
      ))}
    </>
  );
}

function CatalogQuerySync({
  onQueryChange,
}: {
  onQueryChange: (q: string) => void;
}) {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const prevRef = useRef<string | null>(null);

  useEffect(() => {
    if (prevRef.current === null) {
      prevRef.current = q;
      if (q !== "") onQueryChange(q);
      return;
    }
    if (prevRef.current !== q) {
      prevRef.current = q;
      onQueryChange(q);
    }
  }, [q, onQueryChange]);

  return null;
}

interface FilterBoxProps {
  categories: ProductCategory[];
  searchText: string;
  onlyNew: boolean;
  selectedSlugs: string[];
  hasActiveFilters: boolean;
  defaultGroupsOpen: boolean;
  isDrawer?: boolean;
  onSearchChange: (value: string) => void;
  onToggleNew: () => void;
  onToggleSlug: (slug: string) => void;
  onReset: () => void;
  onClose?: () => void;
}

function FilterBox({
  categories,
  searchText,
  onlyNew,
  selectedSlugs,
  hasActiveFilters,
  defaultGroupsOpen,
  isDrawer = false,
  onSearchChange,
  onToggleNew,
  onToggleSlug,
  onReset,
  onClose,
}: FilterBoxProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    productGroups.forEach((g) => {
      initial[g.id] = defaultGroupsOpen;
    });
    return initial;
  });

  const toggleGroup = (id: ProductGroupId) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="v2-cat-filter-box">
      <div className="v2-cat-filter-head">
        <Filter size={20} strokeWidth={1.5} aria-hidden="true" />
        <span>Bộ lọc</span>
        {isDrawer && onClose && (
          <button
            type="button"
            className="v2-cat-filter-close"
            onClick={onClose}
            aria-label="Đóng bộ lọc"
          >
            <X size={18} strokeWidth={2} aria-hidden="true" />
          </button>
        )}
      </div>

      <label className="v2-cat-search">
        <span className="sr-only">Tìm theo tên</span>
        <input
          type="search"
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm theo tên..."
        />
        <Search size={20} strokeWidth={1.5} aria-hidden="true" />
      </label>

      <label className="v2-cat-check is-row">
        <span>Sản phẩm mới</span>
        <input
          type="checkbox"
          checked={onlyNew}
          onChange={onToggleNew}
        />
      </label>

      {productGroups.map((group) => {
        const groupCats = categories.filter((c) => c.groupId === group.id);
        const isOpen = !!openGroups[group.id];
        return (
          <div
            key={group.id}
            className={`v2-cat-group${isOpen ? " is-open" : ""}`}
          >
            <button
              type="button"
              className="v2-cat-group-head"
              aria-expanded={isOpen}
              onClick={() => toggleGroup(group.id)}
            >
              <span>{group.name}</span>
              <ChevronDown size={16} strokeWidth={2} aria-hidden="true" />
            </button>
            <div
              className="v2-m-collapse"
              data-open={isOpen ? "true" : "false"}
              aria-hidden={!isOpen}
              inert={!isOpen ? true : undefined}
            >
              <div>
                <div className="v2-cat-group-body">
                  {groupCats.map((cat) => (
                    <label key={cat.slug} className="v2-cat-check">
                      <span>{cat.title}</span>
                      <input
                        type="checkbox"
                        checked={selectedSlugs.includes(cat.slug)}
                        onChange={() => onToggleSlug(cat.slug)}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {hasActiveFilters && (
        <button type="button" className="v2-cat-reset" onClick={onReset}>
          Xoá bộ lọc
        </button>
      )}
    </div>
  );
}

export function CategoryCatalogView({
  initialSlug,
  activeCategory,
  pageTitle,
  pageDescription,
  bannerImage,
  categories = defaultCategories,
  products = defaultProducts,
}: CategoryCatalogViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { lenisRef } = useUI();

  const defaultSelectedSlugs = useMemo(
    () => computeDefaultSlugs(initialSlug, categories),
    [categories, initialSlug]
  );

  const [prevSlug, setPrevSlug] = useState(initialSlug);
  const [urlQuery, setUrlQuery] = useState("");
  const [searchText, setSearchText] = useState("");
  const [onlyNew, setOnlyNew] = useState(false);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(
    () => defaultSelectedSlugs
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [tabShown, setTabShown] = useState(false);

  const listRef = useRef<HTMLElement>(null);
  const skipNextEmptyQuerySyncRef = useRef(false);

  if (prevSlug !== initialSlug) {
    setPrevSlug(initialSlug);
    setSelectedSlugs(computeDefaultSlugs(initialSlug, categories));
    setCurrentPage(1);
  }

  const handleUrlQueryChange = useCallback((nextQ: string) => {
    if (nextQ === "" && skipNextEmptyQuerySyncRef.current) {
      skipNextEmptyQuerySyncRef.current = false;
      setUrlQuery("");
      return;
    }
    skipNextEmptyQuerySyncRef.current = false;
    setUrlQuery(nextQ);
    setSearchText(nextQ);
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback(
    (nextValue: string) => {
      setSearchText(nextValue);
      setCurrentPage(1);
      if (urlQuery !== "" && nextValue !== urlQuery) {
        skipNextEmptyQuerySyncRef.current = true;
        setUrlQuery("");
        router.replace(pathname, { scroll: false });
      }
    },
    [pathname, router, urlQuery]
  );

  const handleToggleNew = useCallback(() => {
    setOnlyNew((prev) => !prev);
    setCurrentPage(1);
  }, []);

  const handleToggleSlug = useCallback((slug: string) => {
    setSelectedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
    setCurrentPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    skipNextEmptyQuerySyncRef.current = false;
    setSearchText("");
    setOnlyNew(false);
    setSelectedSlugs(defaultSelectedSlugs);
    setCurrentPage(1);
    if (urlQuery !== "") {
      setUrlQuery("");
      router.replace(pathname, { scroll: false });
    }
  }, [defaultSelectedSlugs, pathname, router, urlQuery]);

  const hasActiveFilters = useMemo(() => {
    return (
      searchText.trim() !== "" ||
      urlQuery !== "" ||
      onlyNew ||
      !sameSlugSelection(selectedSlugs, defaultSelectedSlugs)
    );
  }, [defaultSelectedSlugs, onlyNew, searchText, selectedSlugs, urlQuery]);

  const filteredProducts = useMemo(() => {
    const q = normalizeSearch(searchText);
    return products.filter((p) => {
      if (selectedSlugs.length > 0 && !selectedSlugs.includes(p.categorySlug)) {
        return false;
      }
      if (onlyNew && !p.isNew) return false;
      if (
        q &&
        !normalizeSearch(
          `${p.name} ${p.categoryName} ${p.groupName} ${p.description}`
        ).includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [onlyNew, products, searchText, selectedSlugs]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / CATEGORY_PAGE_SIZE)
  );
  const safePage = Math.min(currentPage, totalPages);
  const pagedProducts = useMemo(() => {
    const start = (safePage - 1) * CATEGORY_PAGE_SIZE;
    return filteredProducts.slice(start, start + CATEGORY_PAGE_SIZE);
  }, [filteredProducts, safePage]);

  const scrollToList = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (lenisRef.current && !prefersReduced) {
      lenisRef.current.scrollTo(el, { offset: -60, duration: 1.2 });
    } else {
      const top = el.getBoundingClientRect().top + window.scrollY - 60;
      window.scrollTo({
        top: Math.max(0, top),
        behavior: prefersReduced ? "auto" : "smooth",
      });
    }
  }, [lenisRef]);

  const handlePageSelect = useCallback(
    (pageNum: number) => {
      setCurrentPage(pageNum);
      requestAnimationFrame(() => scrollToList());
    },
    [scrollToList]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateTabVisibility = () => {
      const el = listRef.current;
      const shown =
        window.scrollY > 120 &&
        !!el &&
        el.getBoundingClientRect().bottom > window.innerHeight / 2;
      setTabShown(shown);
    };

    const rafId = requestAnimationFrame(updateTabVisibility);
    window.addEventListener("scroll", updateTabVisibility, { passive: true });
    window.addEventListener("resize", updateTabVisibility, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", updateTabVisibility);
      window.removeEventListener("resize", updateTabVisibility);
    };
  }, [filteredProducts.length, safePage]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1100px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setMobileFilterOpen(false);
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!mobileFilterOpen) return;
    const lenis = lenisRef.current;
    lenis?.stop();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileFilterOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      lenis?.start();
    };
  }, [mobileFilterOpen, lenisRef]);

  const gridAnimKey = `${safePage}|${searchText}|${onlyNew}|${selectedSlugs.join(",")}`;

  return (
    <div className="v2-cat">
      <Suspense fallback={null}>
        <CatalogQuerySync onQueryChange={handleUrlQueryChange} />
      </Suspense>

      {/* Banner */}
      <section className="v2-cat-banner">
        <div className="v2-cat-banner-media">
          <img src={bannerImage} alt={pageTitle} />
          <div className="v2-media-vignette" aria-hidden="true" />
        </div>

        <div className="v2-wrap v2-cat-banner-copy" aria-hidden="true">
          <div
            className="v2-split is-chars is-alternate v2-cat-banner-title"
            style={{ "--split-delay": "0.3s" } as React.CSSProperties}
          >
            <span className="sr-only">{pageTitle}</span>
            <SplitWordsContent text={pageTitle} />
          </div>
        </div>

        <button
          type="button"
          className="v2-cat-down v2-round"
          aria-label="Xem danh sách sản phẩm"
          onClick={scrollToList}
        >
          <ArrowDown size={16} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </section>

      {/* List & Filter Section */}
      <section
        id="v2-cat-list"
        ref={listRef}
        className="v2-cat-list"
        aria-busy="false"
      >
        <div className="v2-wrap v2-cat-head">
          <p className="v2-cat-eyebrow">
            {activeCategory && (
              <>
                <Link href={`/danh-muc/${activeCategory.groupId}`}>
                  {activeCategory.groupName}
                </Link>
                {" · "}
              </>
            )}
            Danh sách sản phẩm
          </p>
          <h1
            aria-label={pageTitle}
            className="v2-split is-chars is-fade v2-cat-title"
            style={{ "--split-delay": "0.35s" } as React.CSSProperties}
          >
            <SplitWordsContent text={pageTitle} />
          </h1>
          {pageDescription && <p className="v2-cat-intro">{pageDescription}</p>}
        </div>

        <div className="v2-cat-body">
          <aside className="v2-cat-aside" aria-label="Bộ lọc">
            <FilterBox
              categories={categories}
              searchText={searchText}
              onlyNew={onlyNew}
              selectedSlugs={selectedSlugs}
              hasActiveFilters={hasActiveFilters}
              defaultGroupsOpen={false}
              onSearchChange={handleSearchChange}
              onToggleNew={handleToggleNew}
              onToggleSlug={handleToggleSlug}
              onReset={resetFilters}
            />
          </aside>

          <div className="v2-cat-results">
            {pagedProducts.length === 0 ? (
              <p className="v2-cat-empty">Chưa có sản phẩm phù hợp.</p>
            ) : (
              <div key={gridAnimKey} className="v2-cat-grid">
                {pagedProducts.map((product, idx) => (
                  <Link
                    key={product.slug}
                    href={`/san-pham/${product.slug}`}
                    className="v2-cat-card"
                    style={{ "--order": idx } as React.CSSProperties}
                  >
                    <div className="v2-cat-card-pic">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        loading={idx < 6 ? "eager" : "lazy"}
                      />
                    </div>
                    <p className="v2-cat-card-label">{product.categoryName}</p>
                    <h2 className="v2-cat-card-name">{product.name}</h2>
                    <p className="v2-cat-card-sub">Giá: {product.priceLabel}</p>
                  </Link>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <nav className="v2-cat-pages" aria-label="Phân trang">
                <span>Trang:</span>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      className={
                        pageNum === safePage ? "is-current" : undefined
                      }
                      aria-current={pageNum === safePage ? "page" : undefined}
                      onClick={() => handlePageSelect(pageNum)}
                    >
                      {pageNum}
                    </button>
                  )
                )}
              </nav>
            )}
          </div>
        </div>
      </section>

      {/* Mobile Fixed Filter Tab */}
      <button
        type="button"
        className={`v2-cat-tab${tabShown && !mobileFilterOpen ? " is-shown" : ""}`}
        aria-label="Mở bộ lọc"
        aria-expanded={mobileFilterOpen}
        onClick={() => setMobileFilterOpen(true)}
      >
        <Filter size={16} strokeWidth={1.5} aria-hidden="true" />
        <span>Bộ lọc</span>
      </button>

      {/* Mobile Slide-Over Filter Drawer */}
      <div
        className={`v2-cat-drawer${mobileFilterOpen ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Bộ lọc"
        aria-hidden={!mobileFilterOpen}
        inert={!mobileFilterOpen ? true : undefined}
        data-lenis-prevent="true"
      >
        <button
          type="button"
          className="v2-cat-drawer-backdrop"
          aria-label="Đóng bộ lọc"
          tabIndex={-1}
          onClick={() => setMobileFilterOpen(false)}
        />
        <div className="v2-cat-drawer-sheet">
          <FilterBox
            categories={categories}
            searchText={searchText}
            onlyNew={onlyNew}
            selectedSlugs={selectedSlugs}
            hasActiveFilters={hasActiveFilters}
            defaultGroupsOpen={true}
            isDrawer
            onSearchChange={handleSearchChange}
            onToggleNew={handleToggleNew}
            onToggleSlug={handleToggleSlug}
            onReset={resetFilters}
            onClose={() => setMobileFilterOpen(false)}
          />
        </div>
      </div>
    </div>
  );
}
