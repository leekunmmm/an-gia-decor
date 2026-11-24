import React from "react";
import { requireAdminUser } from "@/lib/supabase/server";
import {
  LeadsManager,
  type AdminLeadRow,
} from "@/components/admin/LeadsManager";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  const session = await requireAdminUser();
  if (!session) return null;

  const { data } = await session.supabase
    .from("contact_leads")
    .select("*")
    .order("created_at", { ascending: false });

  return <LeadsManager initialLeads={(data ?? []) as AdminLeadRow[]} />;
}
