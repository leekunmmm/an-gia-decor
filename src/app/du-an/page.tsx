import React from "react";
import type { Metadata } from "next";
import { ProjectsView } from "@/components/projects/ProjectsView";
import { getProjects, getSiteSettings } from "@/lib/data-service";
import { buildBreadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildPageMetadata({
    title: "Dự án hoàn thiện",
    description: `Hồ sơ các công trình nhà phố, văn phòng và cửa hàng thực tế do ${settings.name} thiết kế, sản xuất và lắp đặt hoàn thiện.`,
    path: "/du-an",
    image: "/images/project-villa.jpg",
    siteName: settings.name,
  });
}

export default async function ProjectsPage() {
  const projects = await getProjects();
  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Trang chủ", path: "/" },
          { name: "Dự án", path: "/du-an" },
        ])}
      />
      <ProjectsView initialType="tat-ca" projects={projects} />
    </>
  );
}
