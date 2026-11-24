import type { MetadataRoute } from "next";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/seo";
import {
  getArticles,
  getCategories,
  getCollections,
  getProductGroups,
  getProducts,
  getProjects,
} from "@/lib/data-service";

export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const [categories, products, collections, projects, library, news] =
    await Promise.all([
      getCategories(),
      getProducts(),
      getCollections(),
      getProjects(),
      getArticles("library"),
      getArticles("news"),
    ]);

  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: toAbsoluteUrl("/danh-muc/tat-ca", baseUrl),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: toAbsoluteUrl("/bo-suu-tap", baseUrl),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: toAbsoluteUrl("/du-an", baseUrl),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: toAbsoluteUrl("/du-an/loai/nha-pho", baseUrl),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: toAbsoluteUrl("/du-an/loai/van-phong", baseUrl),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: toAbsoluteUrl("/du-an/loai/cua-hang", baseUrl),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: toAbsoluteUrl("/thu-vien", baseUrl),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: toAbsoluteUrl("/tin-tuc", baseUrl),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const groupRoutes: MetadataRoute.Sitemap = getProductGroups().map((g) => ({
    url: toAbsoluteUrl(`/danh-muc/${g.id}`, baseUrl),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: toAbsoluteUrl(`/danh-muc/${c.slug}`, baseUrl),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: toAbsoluteUrl(`/san-pham/${p.slug}`, baseUrl),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  const collectionRoutes: MetadataRoute.Sitemap = collections.map((c) => ({
    url: toAbsoluteUrl(`/bo-suu-tap/${c.slug}`, baseUrl),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const projectRoutes: MetadataRoute.Sitemap = projects.map((p) => ({
    url: toAbsoluteUrl(`/du-an/${p.slug}`, baseUrl),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  const articleRoutes: MetadataRoute.Sitemap = [
    ...library.map((a) => ({
      url: toAbsoluteUrl(`/thu-vien/${a.slug}`, baseUrl),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
    ...news.map((a) => ({
      url: toAbsoluteUrl(`/tin-tuc/${a.slug}`, baseUrl),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
  ];

  return [
    ...staticRoutes,
    ...groupRoutes,
    ...categoryRoutes,
    ...productRoutes,
    ...collectionRoutes,
    ...projectRoutes,
    ...articleRoutes,
  ];
}
