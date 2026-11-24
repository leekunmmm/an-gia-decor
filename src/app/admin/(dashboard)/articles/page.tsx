import React from "react";
import { requireAdminUser } from "@/lib/supabase/server";
import {
  ArticlesManager,
  type AdminArticleRow,
} from "@/components/admin/ArticlesManager";

export const dynamic = "force-dynamic";

export default async function AdminArticlesPage() {
  const session = await requireAdminUser();
  if (!session) return null;

  const { data } = await session.supabase
    .from("articles")
    .select("*")
    .order("sort_order", { ascending: true });

  return <ArticlesManager initialArticles={(data ?? []) as AdminArticleRow[]} />;
}
