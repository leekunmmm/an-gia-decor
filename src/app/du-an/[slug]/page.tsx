import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectDetailView } from "@/components/projects/ProjectsView";
import {
  getProducts,
  getProjectBySlug,
  getProjects,
  getSiteSettings,
} from "@/lib/data-service";
import { buildBreadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const revalidate = 60;

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [project, settings] = await Promise.all([
    getProjectBySlug(slug),
    getSiteSettings(),
  ]);
  if (!project) {
    return {
      title: "Dự án",
    };
  }
  return buildPageMetadata({
    title: project.title,
    description: project.summary,
    path: `/du-an/${project.slug}`,
    image: project.coverImage,
    siteName: settings.name,
  });
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [project, allProjects, allProducts] = await Promise.all([
    getProjectBySlug(slug),
    getProjects(),
    getProducts(),
  ]);
  if (!project) {
    notFound();
  }
  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Trang chủ", path: "/" },
          { name: "Dự án", path: "/du-an" },
          { name: project.typeLabel, path: `/du-an/loai/${project.type}` },
          { name: project.title, path: `/du-an/${project.slug}` },
        ])}
      />
      <ProjectDetailView
        project={project}
        allProjects={allProjects}
        allProducts={allProducts}
      />
    </>
  );
}
