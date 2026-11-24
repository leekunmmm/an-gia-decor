import React, { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ProductCategory } from "@/data/categories";
import {
  getCategories,
  getProductGroups,
  getProducts,
  getSiteSettings,
} from "@/lib/data-service";
import { buildBreadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { CategoryCatalogView } from "@/components/catalog/CategoryCatalogView";

export const revalidate = 60;

const ALL_CATALOG_META = {
  title: "Catalogue Sản Phẩm 2026",
  description:
    "Tuyển tập đầy đủ các dòng sofa da chống trầy, sofa Bắc Âu, bàn trà đá tự nhiên, bàn ăn và giường ngủ tại An Gia Decor.",
  bannerImage: "/images/room-living.jpg",
};

function resolveCategoryPageData(
  slug: string,
  allCategories: ProductCategory[]
) {
  if (slug === "tat-ca" || slug === "all") {
    return {
      initialSlug: "tat-ca",
      activeCategory: undefined,
      pageTitle: ALL_CATALOG_META.title,
      pageDescription: ALL_CATALOG_META.description,
      bannerImage: ALL_CATALOG_META.bannerImage,
    };
  }

  const productGroups = getProductGroups();
  const groupMatch = productGroups.find((g) => g.id === slug);
  if (groupMatch) {
    const firstCat = allCategories.find((c) => c.groupId === groupMatch.id);
    return {
      initialSlug: groupMatch.id,
      activeCategory: undefined,
      pageTitle: groupMatch.name,
      pageDescription: groupMatch.description,
      bannerImage: firstCat?.bannerImage || "/images/room-living.jpg",
    };
  }

  const cat = allCategories.find((c) => c.slug === slug);
  if (!cat) {
    return null;
  }

  return {
    initialSlug: cat.slug,
    activeCategory: cat,
    pageTitle: cat.title,
    pageDescription: cat.description,
    bannerImage: cat.bannerImage,
  };
}

export async function generateStaticParams() {
  const allCategories = await getCategories();
  return [
    { slug: "tat-ca" },
    { slug: "all" },
    ...getProductGroups().map((g) => ({ slug: g.id })),
    ...allCategories.map((c) => ({ slug: c.slug })),
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [allCategories, settings] = await Promise.all([
    getCategories(),
    getSiteSettings(),
  ]);
  const data = resolveCategoryPageData(slug, allCategories);

  if (!data) {
    return {
      title: "Danh mục không tồn tại",
      description: `Danh mục sản phẩm bạn tìm kiếm hiện không có tại ${settings.name}.`,
    };
  }

  return buildPageMetadata({
    title: data.pageTitle,
    description: data.pageDescription,
    path: `/danh-muc/${slug}`,
    image: data.bannerImage,
    siteName: settings.name,
  });
}

export default async function CategorySlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [allCategories, allProducts] = await Promise.all([
    getCategories(),
    getProducts(),
  ]);
  const data = resolveCategoryPageData(slug, allCategories);

  if (!data) {
    notFound();
  }

  const crumbs = [
    { name: "Trang chủ", path: "/" },
    { name: "Danh mục", path: "/danh-muc/tat-ca" },
    ...(data.activeCategory
      ? [
          {
            name: data.activeCategory.groupName,
            path: `/danh-muc/${data.activeCategory.groupId}`,
          },
          { name: data.pageTitle, path: `/danh-muc/${slug}` },
        ]
      : slug !== "tat-ca" && slug !== "all"
      ? [{ name: data.pageTitle, path: `/danh-muc/${slug}` }]
      : []),
  ];

  return (
    <Suspense fallback={<div className="v2-cat" aria-busy="true" />}>
      <JsonLd data={buildBreadcrumbJsonLd(crumbs)} />
      <CategoryCatalogView
        key={data.initialSlug}
        initialSlug={data.initialSlug}
        activeCategory={data.activeCategory}
        pageTitle={data.pageTitle}
        pageDescription={data.pageDescription}
        bannerImage={data.bannerImage}
        categories={allCategories}
        products={allProducts}
      />
    </Suspense>
  );
}
