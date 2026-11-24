"use client";

import React from "react";
import { brandConfig, type BrandConfig } from "@/config/brand";

export type ChannelKey = "shopee" | "zalo" | "messenger" | "hotline";

export interface ChannelIconProps {
  className?: string;
  size?: number;
  variant?: "brand" | "current";
}

export function MessengerIcon({
  className,
  size = 20,
  variant = "brand",
}: ChannelIconProps) {
  const isBrand = variant === "brand";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 2C6.477 2 2 6.145 2 11.259c0 2.91 1.454 5.505 3.727 7.203V22l3.406-1.87c.909.251 1.872.387 2.867.387 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2Z"
        fill={isBrand ? "#0084FF" : "currentColor"}
      />
      <path
        d="M13.06 14.37 10.52 11.66 5.56 14.37l5.45-5.78 2.61 2.71 4.89-2.71-5.45 5.78Z"
        fill={isBrand ? "#FFFFFF" : "#141619"}
      />
    </svg>
  );
}

export function ZaloIcon({
  className,
  size = 20,
  variant = "brand",
}: ChannelIconProps) {
  const isBrand = variant === "brand";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 2.25C6.615 2.25 2.25 6.265 2.25 11.22c0 2.67 1.265 5.07 3.285 6.72L4.65 21.75l3.99-1.98c1.07.31 2.2.48 3.36.48 5.385 0 9.75-4.015 9.75-8.97S17.385 2.25 12 2.25Z"
        fill={isBrand ? "#0068FF" : "currentColor"}
      />
      <path
        d="M6.4 8.65h4.05L6.55 13.7h4.05M11.65 11.65a1.55 1.55 0 1 0 3.1 0 1.55 1.55 0 1 0-3.1 0Zm3.1-1.4v2.95M16.2 8.2v5M17.55 11.65a1.45 1.45 0 1 0 2.9 0 1.45 1.45 0 1 0-2.9 0Z"
        stroke={isBrand ? "#FFFFFF" : "#141619"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ShopeeIcon({
  className,
  size = 20,
  variant = "brand",
}: ChannelIconProps) {
  const isBrand = variant === "brand";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M8.5 7.5V6a3.5 3.5 0 0 1 7 0v1.5"
        stroke={isBrand ? "#EE4D2D" : "currentColor"}
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M4.5 7.5h15l1.05 12.6a1.5 1.5 0 0 1-1.5 1.65H4.95a1.5 1.5 0 0 1-1.5-1.65L4.5 7.5Z"
        fill={isBrand ? "#EE4D2D" : "currentColor"}
      />
      <path
        d="M14.2 11.75c-.45-.72-1.25-1.12-2.22-1.12-1.24 0-2.12.66-2.12 1.65 0 1.02.92 1.42 2.2 1.78 1.32.37 2.2.82 2.2 1.92 0 1.18-1.04 1.9-2.4 1.9-1.2 0-2.14-.46-2.7-1.3"
        stroke={isBrand ? "#FFFFFF" : "#141619"}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PhoneIcon({
  className,
  size = 20,
}: ChannelIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export interface ChannelMeta {
  key: ChannelKey;
  label: string;
  shortLabel: string;
  href: string;
  isExternal: boolean;
  actionClassName: string;
  renderIcon: (props?: ChannelIconProps) => React.ReactNode;
}

export function getChannelItems(
  order: ChannelKey[] = ["shopee", "zalo", "messenger", "hotline"],
  settings: BrandConfig = brandConfig
): ChannelMeta[] {
  const map: Record<ChannelKey, ChannelMeta> = {
    shopee: {
      key: "shopee",
      label: "Mua trên Shopee",
      shortLabel: "Shopee",
      href: settings.shopeeUrl,
      isExternal: true,
      actionClassName: "ny-contact-action-shopee",
      renderIcon: (props) => <ShopeeIcon {...props} />,
    },
    zalo: {
      key: "zalo",
      label: "Nhắn Zalo",
      shortLabel: "Zalo",
      href: settings.zaloUrl,
      isExternal: true,
      actionClassName: "ny-contact-action-zalo",
      renderIcon: (props) => <ZaloIcon {...props} />,
    },
    messenger: {
      key: "messenger",
      label: "Nhắn Messenger",
      shortLabel: "Messenger",
      href: settings.messengerUrl,
      isExternal: true,
      actionClassName: "ny-contact-action-messenger",
      renderIcon: (props) => <MessengerIcon {...props} />,
    },
    hotline: {
      key: "hotline",
      label: `Gọi ${settings.name}`,
      shortLabel: settings.hotline,
      href: `tel:${settings.hotlineRaw}`,
      isExternal: false,
      actionClassName: "ny-contact-action-phone",
      renderIcon: (props) => <PhoneIcon {...props} />,
    },
  };
  return order.map((key) => map[key]);
}

export function ChannelAnchor({
  channel,
  className,
  ariaLabel,
  tabIndex,
  onClick,
  children,
}: {
  channel: ChannelMeta;
  className?: string;
  ariaLabel?: string;
  tabIndex?: number;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <a
      href={channel.href}
      target={channel.isExternal ? "_blank" : undefined}
      rel={channel.isExternal ? "noopener noreferrer" : undefined}
      aria-label={ariaLabel ?? channel.label}
      tabIndex={tabIndex}
      onClick={onClick}
      className={className}
    >
      {children}
    </a>
  );
}
