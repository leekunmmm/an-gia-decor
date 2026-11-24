import { cache } from "react";
import { brandConfig, type BrandConfig } from "@/config/brand";
import {
  productGroups,
  type ProductCategory,
  type ProductGroup,
  type ProductGroupId,
} from "@/data/categories";
import type { Product } from "@/data/products";
import type { CollectionItem } from "@/data/collections";
import type { ProjectItem, ProjectType } from "@/data/projects";
import type { EditorialArticle } from "@/data/editorial";
import {
  commitmentData as fallbackCommitmentData,
  heroSlides as fallbackHeroSlides,
  spotlightNordic as fallbackSpotlightNordic,
  spotlightWood as fallbackSpotlightWood,
  videoReels as fallbackVideoReels,
  type HeroSlide,
  type SpotlightData,
  type VideoReel,
} from "@/data/homepage";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import type { ArticleKind, ArticleRecord } from "@/lib/types";

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function asSections(
  value: unknown
): { heading: string; paragraphs: string[] }[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is { heading?: unknown; paragraphs?: unknown } =>
        Boolean(item) && typeof item === "object"
    )
    .map((sec) => ({
      heading: typeof sec.heading === "string" ? sec.heading : "",
      paragraphs: asStringArray(sec.paragraphs),
    }));
}

function mapSiteSettingsRow(row: Record<string, unknown>): BrandConfig {
  return {
    name: (row.name as string) || brandConfig.name,
    shortName: (row.short_name as string) || brandConfig.shortName,
    subName: (row.sub_name as string) || brandConfig.subName,
    monogram: (row.monogram as string) || brandConfig.monogram,
    domain: (row.domain as string) || brandConfig.domain,
    tagline: (row.tagline as string) || brandConfig.tagline,
    description: (row.description as string) || brandConfig.description,
    hotline: (row.hotline as string) || brandConfig.hotline,
    hotlineRaw: (row.hotline_raw as string) || brandConfig.hotlineRaw,
    email: (row.email as string) || brandConfig.email,
    zaloUrl:
      typeof row.zalo_url === "string" ? row.zalo_url : brandConfig.zaloUrl,
    messengerUrl:
      typeof row.messenger_url === "string"
        ? row.messenger_url
        : brandConfig.messengerUrl,
    tiktokUrl:
      typeof row.tiktok_url === "string"
        ? row.tiktok_url
        : brandConfig.tiktokUrl,
    shopeeUrl:
      typeof row.shopee_url === "string"
        ? row.shopee_url
        : brandConfig.shopeeUrl,
    address: (row.address as string) || brandConfig.address,
    hours: (row.hours as string) || brandConfig.hours,
    mapEmbedUrl:
      typeof row.map_embed_url === "string"
        ? row.map_embed_url
        : brandConfig.mapEmbedUrl,
    experienceStat:
      (row.experience_stat as string) || brandConfig.experienceStat,
    experienceLabel:
      (row.experience_label as string) || brandConfig.experienceLabel,
    copyrightYear:
      (row.copyright_year as string) || brandConfig.copyrightYear,
    logos: {
      horizontal:
        (row.logo_horizontal as string) || brandConfig.logos.horizontal,
      stacked: (row.logo_stacked as string) || brandConfig.logos.stacked,
      mark: (row.logo_mark as string) || brandConfig.logos.mark,
    },
  };
}

function mapCategoryRow(row: Record<string, unknown>): ProductCategory {
  return {
    slug: String(row.slug),
    title: String(row.title),
    groupId: String(row.group_id) as ProductGroupId,
    groupName: String(row.group_name),
    bannerImage: String(row.banner_image || "/images/hero-classic.jpg"),
    previewImage: String(row.preview_image || "/images/sofa-nordic.jpg"),
    subcategories: asStringArray(row.subcategories),
    description: String(row.description || ""),
  };
}

function mapProductRow(row: Record<string, unknown>): Product {
  return {
    slug: String(row.slug),
    name: String(row.name),
    categorySlug: String(row.category_slug),
    categoryName: String(row.category_name),
    groupId: String(row.group_id) as ProductGroupId,
    groupName: String(row.group_name),
    isNew: Boolean(row.is_new),
    priceLabel: String(row.price_label || "Liên hệ"),
    images: asStringArray(row.images),
    applicationImage: String(
      row.application_image || "/images/room-living.jpg"
    ),
    description: String(row.description || ""),
    highlights: asStringArray(row.highlights),
    colors: asStringArray(row.colors),
    suitableSpaces: asStringArray(row.suitable_spaces),
    dimensionsAndMaterials: String(row.dimensions_and_materials || ""),
    careInstructions: String(row.care_instructions || ""),
    relatedSlugs: asStringArray(row.related_slugs),
  };
}

function mapCollectionRow(row: Record<string, unknown>): CollectionItem {
  return {
    slug: String(row.slug),
    eyebrow: String(row.eyebrow || ""),
    title: String(row.title),
    subtitle: String(row.subtitle || ""),
    itemCount: Number.parseInt(String(row.item_count || "0"), 10) || 0,
    image: String(row.image || "/images/hero-leather.jpg"),
    hoverImage:
      typeof row.hover_image === "string" && row.hover_image
        ? row.hover_image
        : undefined,
    href: String(row.href || `/bo-suu-tap/${row.slug}`),
  };
}

function mapProjectRow(row: Record<string, unknown>): ProjectItem {
  return {
    slug: String(row.slug),
    title: String(row.title),
    type: String(row.type) as ProjectType,
    typeLabel: String(row.type_label || ""),
    location: String(row.location || ""),
    year: String(row.year || "2026"),
    area: String(row.area || ""),
    featured: Boolean(row.featured),
    coverImage: String(row.cover_image || "/images/project-villa.jpg"),
    gallery: asStringArray(row.gallery),
    summary: String(row.summary || ""),
    scope: asStringArray(row.scope),
  };
}

function mapArticleRow(row: Record<string, unknown>): ArticleRecord {
  const keyPoints = asStringArray(row.key_points);
  return {
    id: typeof row.id === "string" ? row.id : undefined,
    slug: String(row.slug),
    kind: String(row.kind) as ArticleKind,
    title: String(row.title),
    category: String(row.category || ""),
    date: String(row.date || ""),
    readTime: String(row.read_time || "5 phút đọc"),
    excerpt: String(row.excerpt || ""),
    coverImage: String(row.cover_image || "/images/craftsmanship-studio.jpg"),
    isHero: Boolean(row.is_hero),
    ...(keyPoints.length > 0 ? { keyPoints } : {}),
    ...(typeof row.source_label === "string" && row.source_label
      ? { sourceLabel: row.source_label }
      : {}),
    ...(typeof row.source_url === "string" && row.source_url
      ? { sourceUrl: row.source_url }
      : {}),
    sections: asSections(row.sections),
    isPublished: row.is_published !== false,
    sortOrder: typeof row.sort_order === "number" ? row.sort_order : 0,
  };
}

export const getSiteSettings = cache(async (): Promise<BrandConfig> => {
  try {
    const supabase = createPublicSupabaseClient();
    if (!supabase) return brandConfig;

    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) return brandConfig;
    return mapSiteSettingsRow(data as Record<string, unknown>);
  } catch {
    return brandConfig;
  }
});

export function getProductGroups(): ProductGroup[] {
  return productGroups;
}

export const getCategories = cache(async (): Promise<ProductCategory[]> => {
  try {
    const supabase = createPublicSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map(mapCategoryRow);
  } catch {
    return [];
  }
});

export async function getCategoryBySlug(
  slug: string
): Promise<ProductCategory | undefined> {
  const all = await getCategories();
  return all.find((c) => c.slug === slug);
}

export const getProducts = cache(async (): Promise<Product[]> => {
  try {
    const supabase = createPublicSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map(mapProductRow);
  } catch {
    return [];
  }
});

export async function getProductBySlug(
  slug: string
): Promise<Product | undefined> {
  try {
    const supabase = createPublicSupabaseClient();
    if (!supabase) return undefined;

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (error || !data) return undefined;
    return mapProductRow(data as Record<string, unknown>);
  } catch {
    return undefined;
  }
}

export const getCollections = cache(async (): Promise<CollectionItem[]> => {
  try {
    const supabase = createPublicSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("collections")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map(mapCollectionRow);
  } catch {
    return [];
  }
});

export async function getCollectionBySlug(
  slug: string
): Promise<CollectionItem | undefined> {
  const all = await getCollections();
  return all.find((c) => c.slug === slug);
}

export const getProjects = cache(async (): Promise<ProjectItem[]> => {
  try {
    const supabase = createPublicSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map(mapProjectRow);
  } catch {
    return [];
  }
});

export async function getProjectBySlug(
  slug: string
): Promise<ProjectItem | undefined> {
  const all = await getProjects();
  return all.find((p) => p.slug === slug);
}

export async function getArticles(
  kind: ArticleKind
): Promise<EditorialArticle[]> {
  try {
    const supabase = createPublicSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("kind", kind)
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map(mapArticleRow);
  } catch {
    return [];
  }
}

export async function getArticleBySlug(
  kind: ArticleKind,
  slug: string
): Promise<EditorialArticle | undefined> {
  const all = await getArticles(kind);
  return all.find((a) => a.slug === slug);
}

export interface HomepageMediaData {
  heroSlides: HeroSlide[];
  videoReels: VideoReel[];
  spotlightNordic: SpotlightData;
  spotlightWood: SpotlightData;
  commitmentStageImage: string;
  commitmentStageVideoUrl: string;
  commitmentStageCaption: string;
}

const DEFAULT_HOMEPAGE_MEDIA: HomepageMediaData = {
  heroSlides: fallbackHeroSlides,
  videoReels: fallbackVideoReels,
  spotlightNordic: fallbackSpotlightNordic,
  spotlightWood: fallbackSpotlightWood,
  commitmentStageImage: fallbackCommitmentData.stageImage,
  commitmentStageVideoUrl: fallbackCommitmentData.stageVideoUrl ?? "",
  commitmentStageCaption: fallbackCommitmentData.stageCaption,
};

function mergeSpotlight(
  raw: unknown,
  fallback: SpotlightData
): SpotlightData {
  if (!raw || typeof raw !== "object") return fallback;
  const obj = raw as Record<string, unknown>;
  return {
    eyebrow:
      typeof obj.eyebrow === "string" && obj.eyebrow
        ? obj.eyebrow
        : fallback.eyebrow,
    label:
      typeof obj.label === "string" && obj.label ? obj.label : fallback.label,
    title:
      typeof obj.title === "string" && obj.title ? obj.title : fallback.title,
    description:
      typeof obj.description === "string" && obj.description
        ? obj.description
        : fallback.description,
    ctaLabel:
      typeof obj.ctaLabel === "string" && obj.ctaLabel
        ? obj.ctaLabel
        : fallback.ctaLabel,
    href: typeof obj.href === "string" && obj.href ? obj.href : fallback.href,
    image:
      typeof obj.image === "string" && obj.image ? obj.image : fallback.image,
    posterImage:
      typeof obj.posterImage === "string" && obj.posterImage
        ? obj.posterImage
        : typeof obj.image === "string" && obj.image
        ? obj.image
        : fallback.posterImage,
    videoUrl:
      typeof obj.videoUrl === "string" ? obj.videoUrl : fallback.videoUrl,
  };
}

export const getHomepageMedia = cache(async (): Promise<HomepageMediaData> => {
  try {
    const supabase = createPublicSupabaseClient();
    if (!supabase) return DEFAULT_HOMEPAGE_MEDIA;

    const { data, error } = await supabase
      .from("homepage_media")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) return DEFAULT_HOMEPAGE_MEDIA;

    const row = data as Record<string, unknown>;
    const rawSlides = Array.isArray(row.hero_slides)
      ? (row.hero_slides as HeroSlide[])
      : [];
    const rawReels = Array.isArray(row.video_reels)
      ? (row.video_reels as VideoReel[])
      : [];

    return {
      heroSlides: rawSlides.length > 0 ? rawSlides : fallbackHeroSlides,
      videoReels: rawReels.length > 0 ? rawReels : fallbackVideoReels,
      spotlightNordic: mergeSpotlight(
        row.spotlight_nordic,
        fallbackSpotlightNordic
      ),
      spotlightWood: mergeSpotlight(row.spotlight_wood, fallbackSpotlightWood),
      commitmentStageImage:
        typeof row.commitment_stage_image === "string" &&
        row.commitment_stage_image
          ? row.commitment_stage_image
          : fallbackCommitmentData.stageImage,
      commitmentStageVideoUrl:
        typeof row.commitment_stage_video_url === "string"
          ? row.commitment_stage_video_url
          : fallbackCommitmentData.stageVideoUrl ?? "",
      commitmentStageCaption:
        typeof row.commitment_stage_caption === "string" &&
        row.commitment_stage_caption
          ? row.commitment_stage_caption
          : fallbackCommitmentData.stageCaption,
    };
  } catch {
    return DEFAULT_HOMEPAGE_MEDIA;
  }
});
