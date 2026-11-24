"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { UIProvider } from "@/context/UIContext";
import { SiteSettingsProvider } from "@/context/SiteSettingsContext";
import { brandConfig, type BrandConfig } from "@/config/brand";
import {
  categories as defaultCategories,
  type ProductCategory,
} from "@/data/categories";
import { products as defaultProducts, type Product } from "@/data/products";
import { LenisProvider } from "./LenisProvider";
import { PreloaderSplash } from "./PreloaderSplash";
import { TopProgressBar } from "./TopProgressBar";
import { SiteHeader } from "./SiteHeader";
import { MegaMenu } from "./MegaMenu";
import { SearchOverlay } from "./SearchOverlay";
import { AuthModal } from "./AuthModal";
import { FloatingActions } from "./FloatingActions";
import { SiteFooter } from "./SiteFooter";
import { RevealObserver } from "./RevealObserver";

export function AppShell({
  children,
  settings = brandConfig,
  categories = defaultCategories,
  products = defaultProducts,
}: {
  children: React.ReactNode;
  settings?: BrandConfig;
  categories?: ProductCategory[];
  products?: Product[];
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return (
      <SiteSettingsProvider settings={settings}>
        {children}
      </SiteSettingsProvider>
    );
  }

  return (
    <SiteSettingsProvider settings={settings}>
      <UIProvider>
        <LenisProvider>
          <div className="v2 min-h-screen flex flex-col">
            <RevealObserver />
            <PreloaderSplash />
            <TopProgressBar />
            <SiteHeader categories={categories} />
            <MegaMenu categories={categories} />
            <SearchOverlay categories={categories} products={products} />
            <AuthModal />
            <main className="flex-1">{children}</main>
            <SiteFooter />
            <FloatingActions />
          </div>
        </LenisProvider>
      </UIProvider>
    </SiteSettingsProvider>
  );
}
