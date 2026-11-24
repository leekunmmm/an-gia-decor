import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getProductBySlug,
  getProducts,
  getSiteSettings,
} from "@/lib/data-service";
import {
  buildBreadcrumbJsonLd,
  buildPageMetadata,
  buildProductJsonLd,
} from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { ProductDetailView } from "@/components/catalog/ProductDetailView";
import type { Product } from "@/data/products";

export const revalidate = 60;

function pickRelatedProducts(product: Product, allProducts: Product[]): Product[] {
  const picked: Product[] = [];
  const seen = new Set<string>([product.slug]);

  for (const relSlug of product.relatedSlugs) {
    const match = allProducts.find((p) => p.slug === relSlug);
    if (match && !seen.has(match.slug)) {
      seen.add(match.slug);
      picked.push(match);
    }
  }

  for (const candidate of allProducts) {
    if (picked.length >= 6) break;
    if (seen.has(candidate.slug)) continue;
    if (
      candidate.categorySlug === product.categorySlug ||
      candidate.groupId === product.groupId
    ) {
      seen.add(candidate.slug);
      picked.push(candidate);
    }
  }

  return picked.slice(0, 6);
}

export async function generateStaticParams() {
  const allProducts = await getProducts();
  return allProducts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [product, settings] = await Promise.all([
    getProductBySlug(slug),
    getSiteSettings(),
  ]);

  if (!product) {
    return {
      title: "Sản phẩm không tồn tại",
      description: `Không tìm thấy sản phẩm bạn yêu cầu tại ${settings.name}.`,
    };
  }

  return buildPageMetadata({
    title: product.name,
    description: product.description,
    path: `/san-pham/${product.slug}`,
    image: product.images[0] || product.applicationImage,
    siteName: settings.name,
  });
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, allProducts, settings] = await Promise.all([
    getProductBySlug(slug),
    getProducts(),
    getSiteSettings(),
  ]);

  if (!product) {
    notFound();
  }

  const related = pickRelatedProducts(product, allProducts);
  const breadcrumbs = buildBreadcrumbJsonLd([
    { name: "Trang chủ", path: "/" },
    { name: product.groupName, path: `/danh-muc/${product.groupId}` },
    { name: product.categoryName, path: `/danh-muc/${product.categorySlug}` },
    { name: product.name, path: `/san-pham/${product.slug}` },
  ]);

  return (
    <>
      <JsonLd data={[buildProductJsonLd(product, settings), breadcrumbs]} />
      <ProductDetailView
        key={product.slug}
        product={product}
        related={related}
      />
    </>
  );
}
