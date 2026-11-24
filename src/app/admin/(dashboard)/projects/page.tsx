import React from "react";
import { requireAdminUser } from "@/lib/supabase/server";
import {
  ProjectsManager,
  type AdminProjectRow,
} from "@/components/admin/ProjectsManager";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  const session = await requireAdminUser();
  if (!session) return null;

  const { data } = await session.supabase
    .from("projects")
    .select("*")
    .order("sort_order", { ascending: true });

  return <ProjectsManager initialProjects={(data ?? []) as AdminProjectRow[]} />;
}
