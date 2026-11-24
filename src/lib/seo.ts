import type { Metadata } from "next";
import { brandConfig, type BrandConfig } from "@/config/brand";
import type { Product, EditorialArticle } from "@/lib/types";

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    return raw.replace(/\/+$/, "");
  }
  return `https://${brandConfig.domain}`;
}

export function toAbsoluteUrl(pathOrUrl: string, baseUrl = getSiteUrl()): string {
  if (!pathOrUrl) return baseUrl;
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }
  const normalizedPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${baseUrl}${normalizedPath}`;
}

interface BuildPageMetadataInput {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
  siteName?: string;
  noIndex?: boolean;
}

export function buildPageMetadata({
  title,
  description,
  path,
  image,
  type = "website",
  siteName = brandConfig.name,
  noIndex = false,
}: BuildPageMetadataInput): Metadata {
  const siteUrl = getSiteUrl();
  const canonical = toAbsoluteUrl(path, siteUrl);
  const ogImage = toAbsoluteUrl(image || "/images/hero-leather.jpg", siteUrl);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName,
      locale: "vi_VN",
      type,
      images: [
        {
          url: ogImage,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    ...(noIndex
      ? {
          robots: {
            index: false,
            follow: false,
          },
        }
      : {}),
  };
}

export function buildOrganizationJsonLd(settings: BrandConfig = brandConfig) {
  const siteUrl = getSiteUrl();
  const sameAs = [
    settings.zaloUrl,
    settings.messengerUrl,
    settings.tiktokUrl,
    settings.shopeeUrl,
  ].filter((url) => /^https?:\/\//i.test(url));

  return {
    "@context": "https://schema.org",
    "@type": "FurnitureStore",
    name: settings.name,
    description: settings.description,
    url: siteUrl,
    logo: toAbsoluteUrl(settings.logos.stacked, siteUrl),
    image: toAbsoluteUrl("/images/hero-leather.jpg", siteUrl),
    telephone: settings.hotline,
    email: settings.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address,
      addressCountry: "VN",
    },
    openingHours: settings.hours,
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

export function buildBreadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path, siteUrl),
    })),
  };
}

function parseNumericPriceVnd(label: string): string | undefined {
  if (!label || /liên hệ/i.test(label)) return undefined;
  const digits = label.replace(/[^\d]/g, "");
  if (!digits) return undefined;
  const num = Number(digits);
  return Number.isFinite(num) && num >= 1000 ? String(num) : undefined;
}

export function buildProductJsonLd(
  product: Product,
  settings: BrandConfig = brandConfig
) {
  const siteUrl = getSiteUrl();
  const productUrl = toAbsoluteUrl(`/san-pham/${product.slug}`, siteUrl);
  const images = (product.images.length > 0 ? product.images : [product.applicationImage])
    .filter(Boolean)
    .map((img) => toAbsoluteUrl(img, siteUrl));
  const numericPrice = parseNumericPriceVnd(product.priceLabel);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.slug,
    category: product.categoryName,
    image: images,
    brand: {
      "@type": "Brand",
      name: settings.name,
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "VND",
      availability: "https://schema.org/InStock",
      ...(numericPrice ? { price: numericPrice } : {}),
    },
  };
}

function toIsoDateOrUndefined(rawDate: string): string | undefined {
  const match = rawDate.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(rawDate.trim())) {
    return rawDate.trim();
  }
  return undefined;
}

export function buildArticleJsonLd(
  article: EditorialArticle,
  path: string,
  settings: BrandConfig = brandConfig
) {
  const siteUrl = getSiteUrl();
  const url = toAbsoluteUrl(path, siteUrl);
  const isoDate = toIsoDateOrUndefined(article.date);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    image: [toAbsoluteUrl(article.coverImage, siteUrl)],
    ...(isoDate ? { datePublished: isoDate, dateModified: isoDate } : {}),
    author: {
      "@type": "Organization",
      name: settings.name,
    },
    publisher: {
      "@type": "Organization",
      name: settings.name,
      logo: {
        "@type": "ImageObject",
        url: toAbsoluteUrl(settings.logos.stacked, siteUrl),
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };
}
