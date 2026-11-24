import type { Metadata } from "next";
import React from "react";
import { NewsView } from "@/components/editorial/NewsView";
import { getArticles, getSiteSettings } from "@/lib/data-service";
import { buildBreadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildPageMetadata({
    title: "Tin tức & Xu hướng",
    description: `Cập nhật tin tức, sự kiện showroom, xu hướng thiết kế nội thất và cẩm nang lựa chọn vật liệu cùng ${settings.name}.`,
    path: "/tin-tuc",
    image: "/images/reel-showroom.jpg",
    siteName: settings.name,
  });
}

export default async function NewsPage() {
  const articles = await getArticles("news");
  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Trang chủ", path: "/" },
          { name: "Tin tức", path: "/tin-tuc" },
        ])}
      />
      <NewsView articles={articles} />
    </>
  );
}
