"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  ExternalLink,
  FileText,
  FolderTree,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  RefreshCw,
  Settings,
  Users,
  Video,
  X,
} from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { triggerRevalidate } from "@/lib/admin-utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/products", label: "Sản phẩm", icon: Package },
  { href: "/admin/categories", label: "Danh mục", icon: FolderTree },
  { href: "/admin/collections", label: "Bộ sưu tập", icon: Layers },
  { href: "/admin/projects", label: "Dự án", icon: Building2 },
  { href: "/admin/articles", label: "Thư viện & Tin tức", icon: FileText },
  { href: "/admin/videos", label: "Video trang chủ", icon: Video },
  { href: "/admin/leads", label: "Khách liên hệ", icon: Users },
  { href: "/admin/settings", label: "Cài đặt thương hiệu", icon: Settings },
];

export function AdminShell({
  adminEmail,
  adminRole,
  children,
}: {
  adminEmail: string;
  adminRole: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [revalidating, setRevalidating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  const handleRevalidate = async () => {
    setRevalidating(true);
    const ok = await triggerRevalidate();
    setRevalidating(false);
    setNotice(
      ok
        ? "Đã làm mới cache toàn website!"
        : "Không thể làm mới cache, vui lòng thử lại."
    );
    setTimeout(() => setNotice(null), 3000);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#111318] border-r border-zinc-800/90">
      <div className="px-5 py-5 border-b border-zinc-800/90 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-3">
          <img
            src="/images/icon.png"
            alt="An Gia Decor"
            className="w-8 h-8 object-contain"
          />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e2ad21]">
              An Gia Decor
            </p>
            <p className="text-[11px] text-zinc-400">Hệ thống quản trị CMS</p>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
          aria-label="Đóng menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-[#e2ad21]/15 text-[#e2ad21] border border-[#e2ad21]/30"
                  : "text-zinc-300 hover:bg-zinc-800/70 hover:text-white border border-transparent"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-800/90 space-y-3">
        <div className="px-2">
          <p className="text-xs font-semibold text-zinc-200 truncate">
            {adminEmail}
          </p>
          <p className="text-[11px] uppercase tracking-wider text-zinc-500 mt-0.5">
            {adminRole}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-red-950/50 hover:border-red-800/60 hover:text-red-300 px-3 py-2 text-xs font-semibold text-zinc-300 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b0d10] text-zinc-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-10 w-64 h-full">{sidebarContent}</aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-16 px-4 sm:px-6 bg-[#0b0d10]/90 backdrop-blur border-b border-zinc-800/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-zinc-800 text-zinc-300 hover:text-white"
              aria-label="Mở menu quản trị"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold text-zinc-200 hidden sm:inline">
              Bảng điều khiển An Gia Decor
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {notice && (
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {notice}
              </span>
            )}
            <button
              type="button"
              onClick={handleRevalidate}
              disabled={revalidating}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors disabled:opacity-60"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-[#e2ad21] ${
                  revalidating ? "animate-spin" : ""
                }`}
              />
              <span className="hidden sm:inline">Đồng bộ cache</span>
            </button>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#e2ad21] hover:bg-[#d19b16] px-3 py-1.5 text-xs font-bold text-[#141619] transition-colors"
            >
              <span>Xem website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
