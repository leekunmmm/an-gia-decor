import React from "react";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminUser();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <AdminShell
      adminEmail={session.admin.email}
      adminRole={session.admin.role}
    >
      {children}
    </AdminShell>
  );
}
