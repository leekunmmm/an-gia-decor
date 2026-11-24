import React from "react";
import { requireAdminUser } from "@/lib/supabase/server";
import {
  CategoriesManager,
  type AdminCategoryRow,
} from "@/components/admin/CategoriesManager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const session = await requireAdminUser();
  if (!session) return null;

  const { data } = await session.supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <CategoriesManager initialCategories={(data ?? []) as AdminCategoryRow[]} />
  );
}
