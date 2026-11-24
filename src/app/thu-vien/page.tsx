import type { Metadata } from "next";
import React from "react";
import { LibraryView } from "@/components/editorial/LibraryView";
import { getArticles, getSiteSettings } from "@/lib/data-service";
import { buildBreadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildPageMetadata({
    title: "Thư viện vật liệu & kiến thức",
    description: `Kho kiến thức chuyên sâu về chất liệu da, gỗ tự nhiên, đá mặt bàn và giải pháp bố trí không gian sống từ ${settings.name}.`,
    path: "/thu-vien",
    image: "/images/craftsmanship-studio.jpg",
    siteName: settings.name,
  });
}

export default async function LibraryPage() {
  const articles = await getArticles("library");
  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Trang chủ", path: "/" },
          { name: "Thư viện", path: "/thu-vien" },
        ])}
      />
      <LibraryView articles={articles} />
    </>
  );
}
