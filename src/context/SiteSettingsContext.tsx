"use client";

import React, { createContext, useContext } from "react";
import { brandConfig, type BrandConfig } from "@/config/brand";

const SiteSettingsContext = createContext<BrandConfig>(brandConfig);

export function SiteSettingsProvider({
  settings,
  children,
}: {
  settings: BrandConfig;
  children: React.ReactNode;
}) {
  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings(): BrandConfig {
  return useContext(SiteSettingsContext);
}
