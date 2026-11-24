import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: {
    default: "Quản trị | An Gia Decor",
    template: "%s | Admin An Gia Decor",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0b0d10] text-zinc-100 antialiased">
      {children}
    </div>
  );
}
