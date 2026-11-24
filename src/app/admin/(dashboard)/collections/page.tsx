import React from "react";
import { requireAdminUser } from "@/lib/supabase/server";
import {
  CollectionsManager,
  type AdminCollectionRow,
} from "@/components/admin/CollectionsManager";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  const session = await requireAdminUser();
  if (!session) return null;

  const { data } = await session.supabase
    .from("collections")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <CollectionsManager
      initialCollections={(data ?? []) as AdminCollectionRow[]}
    />
  );
}
