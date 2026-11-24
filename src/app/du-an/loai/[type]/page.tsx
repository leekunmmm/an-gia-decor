import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectsView } from "@/components/projects/ProjectsView";
import { projectTypeStats } from "@/data/projects";
import { getProjects, getSiteSettings } from "@/lib/data-service";
import { buildBreadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const revalidate = 60;

const validTypes = ["nha-pho", "van-phong", "cua-hang"];

export function generateStaticParams() {
  return validTypes.map((type) => ({ type }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type } = await params;
  const settings = await getSiteSettings();
  const stat = projectTypeStats.find((s) => s.type === type);
  if (!stat) {
    return {
      title: "Dự án",
    };
  }
  return buildPageMetadata({
    title: `Dự án ${stat.label}`,
    description: `Danh sách dự án nội thất ${stat.label.toLowerCase()} đã bàn giao hoàn thiện bởi ${settings.name}.`,
    path: `/du-an/loai/${type}`,
    image: stat.image,
    siteName: settings.name,
  });
}

export default async function ProjectsByTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!validTypes.includes(type)) {
    notFound();
  }
  const stat = projectTypeStats.find((s) => s.type === type);
  const projects = await getProjects();

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Trang chủ", path: "/" },
          { name: "Dự án", path: "/du-an" },
          {
            name: stat?.label ?? "Phân loại",
            path: `/du-an/loai/${type}`,
          },
        ])}
      />
      <ProjectsView key={type} initialType={type} projects={projects} />
    </>
  );
}
