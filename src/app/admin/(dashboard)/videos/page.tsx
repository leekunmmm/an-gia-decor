import React from "react";
import { requireAdminUser } from "@/lib/supabase/server";
import { getHomepageMedia } from "@/lib/data-service";
import { VideosManager } from "@/components/admin/VideosManager";

export const dynamic = "force-dynamic";

export default async function AdminVideosPage() {
  const session = await requireAdminUser();
  if (!session) return null;

  const media = await getHomepageMedia();
  return <VideosManager initialData={media} />;
}
