import React from "react";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/supabase/server";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const session = await requireAdminUser();
  if (session) {
    redirect("/admin");
  }
  return <AdminLoginForm />;
}
