import React from "react";
import Link from "next/link";
import {
  Building2,
  FileText,
  FolderTree,
  Layers,
  Package,
  Settings,
  Users,
  Video,
} from "lucide-react";
import { requireAdminUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const LEAD_BADGES: Record<string, string> = {
  new: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  contacted: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  quoted: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  closed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

const LEAD_LABELS: Record<string, string> = {
  new: "Mới",
  contacted: "Đã liên hệ",
  quoted: "Đã báo giá",
  closed: "Hoàn tất",
};

export default async function AdminOverviewPage() {
  const session = await requireAdminUser();
  if (!session) return null;

  const { supabase } = session;

  const [
    productsRes,
    categoriesRes,
    collectionsRes,
    projectsRes,
    articlesRes,
    leadsRes,
    newLeadsRes,
    recentLeadsRes,
  ] = await Promise.all([
    supabase.from("products").select("slug", { count: "exact", head: true }),
    supabase.from("categories").select("slug", { count: "exact", head: true }),
    supabase.from("collections").select("slug", { count: "exact", head: true }),
    supabase.from("projects").select("slug", { count: "exact", head: true }),
    supabase.from("articles").select("id", { count: "exact", head: true }),
    supabase.from("contact_leads").select("id", { count: "exact", head: true }),
    supabase
      .from("contact_leads")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
    supabase
      .from("contact_leads")
      .select("id, name, phone, email, message, status, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const cards = [
    {
      label: "Sản phẩm",
      count: productsRes.count ?? 0,
      href: "/admin/products",
      icon: Package,
    },
    {
      label: "Danh mục",
      count: categoriesRes.count ?? 0,
      href: "/admin/categories",
      icon: FolderTree,
    },
    {
      label: "Bộ sưu tập",
      count: collectionsRes.count ?? 0,
      href: "/admin/collections",
      icon: Layers,
    },
    {
      label: "Dự án",
      count: projectsRes.count ?? 0,
      href: "/admin/projects",
      icon: Building2,
    },
    {
      label: "Thư viện & Tin tức",
      count: articlesRes.count ?? 0,
      href: "/admin/articles",
      icon: FileText,
    },
    {
      label: "Khách liên hệ",
      count: leadsRes.count ?? 0,
      sub: `${newLeadsRes.count ?? 0} yêu cầu mới`,
      href: "/admin/leads",
      icon: Users,
    },
  ];

  const recentLeads = recentLeadsRes.data ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Tổng quan hệ thống</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Quản lý toàn bộ dữ liệu sản phẩm, nội dung và khách hàng tiềm năng từ Supabase.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 self-start">
          <Link
            href="/admin/videos"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:border-[#e2ad21]/60 px-4 py-2 text-xs font-semibold text-zinc-200 transition-colors"
          >
            <Video className="w-4 h-4 text-[#e2ad21]" />
            <span>Quản lý Video trang chủ</span>
          </Link>
          <Link
            href="/admin/settings"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:border-[#e2ad21]/60 px-4 py-2 text-xs font-semibold text-zinc-200 transition-colors"
          >
            <Settings className="w-4 h-4 text-[#e2ad21]" />
            <span>Cấu hình Messenger / Zalo / Hotline</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-2xl border border-zinc-800 bg-[#12151b] p-5 hover:border-[#e2ad21]/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {card.label}
                </span>
                <div className="w-9 h-9 rounded-xl bg-zinc-800/80 group-hover:bg-[#e2ad21]/15 flex items-center justify-center text-[#e2ad21]">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white mt-3">{card.count}</p>
              {card.sub && (
                <p className="text-xs text-[#e2ad21] mt-1">{card.sub}</p>
              )}
            </Link>
          );
        })}
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-[#12151b] overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">
            Yêu cầu tư vấn gần nhất
          </h2>
          <Link
            href="/admin/leads"
            className="text-xs font-semibold text-[#e2ad21] hover:underline"
          >
            Xem tất cả →
          </Link>
        </div>

        {recentLeads.length === 0 ? (
          <div className="p-6 text-sm text-zinc-400">
            Chưa có yêu cầu tư vấn nào từ form website.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase tracking-wider text-zinc-400 bg-zinc-900/60">
                <tr>
                  <th className="px-5 py-3">Khách hàng</th>
                  <th className="px-5 py-3">Số điện thoại</th>
                  <th className="px-5 py-3">Lời nhắn</th>
                  <th className="px-5 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {recentLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-zinc-900/40">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-white">{lead.name}</p>
                      {lead.email && (
                        <p className="text-xs text-zinc-400">{lead.email}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-200">{lead.phone}</td>
                    <td className="px-5 py-3.5 text-zinc-400 max-w-xs truncate">
                      {lead.message || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          LEAD_BADGES[lead.status] || LEAD_BADGES.new
                        }`}
                      >
                        {LEAD_LABELS[lead.status] || lead.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
