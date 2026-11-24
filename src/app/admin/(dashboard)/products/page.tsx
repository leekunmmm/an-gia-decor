import React from "react";
import { requireAdminUser } from "@/lib/supabase/server";
import {
  ProductsManager,
  type AdminCategoryOption,
  type AdminProductRow,
} from "@/components/admin/ProductsManager";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const session = await requireAdminUser();
  if (!session) return null;

  const [prodRes, catRes] = await Promise.all([
    session.supabase
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true }),
    session.supabase
      .from("categories")
      .select("slug, title, group_id, group_name")
      .order("sort_order", { ascending: true }),
  ]);

  return (
    <ProductsManager
      initialProducts={(prodRes.data ?? []) as AdminProductRow[]}
      categories={(catRes.data ?? []) as AdminCategoryOption[]}
    />
  );
}
