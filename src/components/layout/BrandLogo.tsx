"use client";
/* eslint-disable @next/next/no-img-element */

import React from "react";
import { useSiteSettings } from "@/context/SiteSettingsContext";

interface BrandLogoProps {
  compact?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function BrandLogo({
  compact = false,
  size = "md",
  className = "",
}: BrandLogoProps) {
  const brandConfig = useSiteSettings();
  if (compact) {
    return (
      <span
        className={`v2-logo-inner inline-flex items-center select-none ${className}`}
      >
        <img
          src={brandConfig.logos.mark}
          alt={brandConfig.name}
          decoding="async"
          className="h-[38px] w-auto object-contain"
        />
      </span>
    );
  }

  if (size === "lg") {
    return (
      <span
        className={`v2-logo-inner inline-flex items-center select-none ${className}`}
      >
        <img
          src={brandConfig.logos.stacked}
          alt={brandConfig.name}
          decoding="async"
          className="h-[84px] w-auto object-contain"
        />
      </span>
    );
  }

  const sizeClasses =
    size === "sm"
      ? "h-[30px] md:h-[34px] max-w-[175px] md:max-w-[210px]"
      : "h-[34px] md:h-[42px] max-w-[185px] md:max-w-[240px]";

  return (
    <span
      className={`v2-logo-inner inline-flex items-center select-none ${className}`}
    >
      <img
        src={brandConfig.logos.horizontal}
        alt={brandConfig.name}
        decoding="async"
        className={`w-auto object-contain ${sizeClasses}`}
      />
    </span>
  );
}
