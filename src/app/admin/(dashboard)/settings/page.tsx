import React from "react";
import { requireAdminUser } from "@/lib/supabase/server";
import { brandConfig } from "@/config/brand";
import {
  SettingsManager,
  type AdminSettingsRow,
} from "@/components/admin/SettingsManager";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await requireAdminUser();
  if (!session) return null;

  const { data } = await session.supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  const fallbackRow: AdminSettingsRow = {
    id: 1,
    name: brandConfig.name,
    short_name: brandConfig.shortName,
    sub_name: brandConfig.subName,
    monogram: brandConfig.monogram,
    domain: brandConfig.domain,
    tagline: brandConfig.tagline,
    description: brandConfig.description,
    hotline: brandConfig.hotline,
    hotline_raw: brandConfig.hotlineRaw,
    email: brandConfig.email,
    zalo_url: brandConfig.zaloUrl,
    messenger_url: brandConfig.messengerUrl,
    tiktok_url: brandConfig.tiktokUrl,
    shopee_url: brandConfig.shopeeUrl,
    address: brandConfig.address,
    hours: brandConfig.hours,
    map_embed_url: brandConfig.mapEmbedUrl,
    experience_stat: brandConfig.experienceStat,
    experience_label: brandConfig.experienceLabel,
    copyright_year: brandConfig.copyrightYear,
    logo_horizontal: brandConfig.logos.horizontal,
    logo_stacked: brandConfig.logos.stacked,
    logo_mark: brandConfig.logos.mark,
  };

  return (
    <SettingsManager
      initialSettings={(data as AdminSettingsRow | null) ?? fallbackRow}
    />
  );
}
