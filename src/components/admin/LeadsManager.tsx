"use client";

import React, { useMemo, useState } from "react";
import { Mail, Phone, Save, Search, Trash2 } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { LeadStatus } from "@/lib/types";

export interface AdminLeadRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  source: string;
  status: LeadStatus;
  notes: string;
  created_at: string;
}

const STATUS_OPTIONS: Array<{ value: LeadStatus; label: string; cls: string }> = [
  {
    value: "new",
    label: "Mới",
    cls: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  {
    value: "contacted",
    label: "Đã liên hệ",
    cls: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  {
    value: "quoted",
    label: "Đã báo giá",
    cls: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  },
  {
    value: "closed",
    label: "Hoàn tất",
    cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
];

export function LeadsManager({
  initialLeads,
}: {
  initialLeads: AdminLeadRow[];
}) {
  const [leads, setLeads] = useState<AdminLeadRow[]>(initialLeads);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialLeads.map((l) => [l.id, l.notes || ""]))
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (
        q &&
        !`${l.name} ${l.phone} ${l.email} ${l.company} ${l.message}`
          .toLowerCase()
          .includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [leads, search, statusFilter]);

  const showNotice = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleStatusChange = async (id: string, nextStatus: LeadStatus) => {
    setSavingId(id);
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from("contact_leads")
      .update({ status: nextStatus })
      .eq("id", id);
    setSavingId(null);
    if (error) {
      window.alert(error.message);
      return;
    }
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: nextStatus } : l))
    );
    showNotice("Đã cập nhật trạng thái khách hàng.");
  };

  const handleSaveNotes = async (id: string) => {
    setSavingId(id);
    const note = draftNotes[id] ?? "";
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from("contact_leads")
      .update({ notes: note })
      .eq("id", id);
    setSavingId(null);
    if (error) {
      window.alert(error.message);
      return;
    }
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, notes: note } : l))
    );
    showNotice("Đã lưu ghi chú chăm sóc khách.");
  };

  const handleDelete = async (lead: AdminLeadRow) => {
    if (!window.confirm(`Xóa yêu cầu từ "${lead.name}" (${lead.phone})?`)) {
      return;
    }
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from("contact_leads")
      .delete()
      .eq("id", lead.id);
    if (error) {
      window.alert(error.message);
      return;
    }
    setLeads((prev) => prev.filter((l) => l.id !== lead.id));
    showNotice("Đã xóa yêu cầu.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Khách hàng liên hệ (CRM)
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Tổng cộng {leads.length} yêu cầu tư vấn gửi từ website.
          </p>
        </div>
        {toast && (
          <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 self-start">
            {toast}
          </span>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-3 justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
              statusFilter === "all"
                ? "bg-[#e2ad21] text-[#141619] border-[#e2ad21]"
                : "bg-zinc-900 text-zinc-300 border-zinc-700"
            }`}
          >
            Tất cả ({leads.length})
          </button>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
                statusFilter === opt.value
                  ? "bg-[#e2ad21] text-[#141619] border-[#e2ad21]"
                  : "bg-zinc-900 text-zinc-300 border-zinc-700"
              }`}
            >
              {opt.label} ({leads.filter((l) => l.status === opt.value).length})
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên, SĐT, email..."
            className="w-full rounded-xl bg-[#12151b] border border-zinc-800 pl-9 pr-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#e2ad21]"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((lead) => {
          const badge =
            STATUS_OPTIONS.find((s) => s.value === lead.status) ??
            STATUS_OPTIONS[0];
          const formattedDate = new Date(lead.created_at).toLocaleString(
            "vi-VN"
          );

          return (
            <div
              key={lead.id}
              className="rounded-2xl border border-zinc-800 bg-[#12151b] p-5 space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-base font-bold text-white">
                      {lead.name}
                    </h2>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {formattedDate} · Nguồn: {lead.source}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-300 pt-1">
                    <a
                      href={`tel:${lead.phone}`}
                      className="inline-flex items-center gap-1.5 text-[#e2ad21] hover:underline font-semibold"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{lead.phone}</span>
                    </a>
                    {lead.email && (
                      <a
                        href={`mailto:${lead.email}`}
                        className="inline-flex items-center gap-1.5 hover:text-white"
                      >
                        <Mail className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{lead.email}</span>
                      </a>
                    )}
                    {lead.company && (
                      <span className="text-zinc-400">
                        Công ty: {lead.company}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-start">
                  <select
                    aria-label={`Trạng thái cho ${lead.name}`}
                    value={lead.status}
                    disabled={savingId === lead.id}
                    onChange={(e) =>
                      handleStatusChange(lead.id, e.target.value as LeadStatus)
                    }
                    className="rounded-xl bg-zinc-950 border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleDelete(lead)}
                    title="Xóa lead"
                    className="p-2 rounded-xl border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-500/50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {lead.message && (
                <p className="text-sm text-zinc-300 bg-zinc-950/70 border border-zinc-800/80 rounded-xl px-4 py-3">
                  {lead.message}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={draftNotes[lead.id] ?? ""}
                  onChange={(e) =>
                    setDraftNotes((prev) => ({
                      ...prev,
                      [lead.id]: e.target.value,
                    }))
                  }
                  placeholder="Ghi chú nội bộ tư vấn viên (báo giá, lịch hẹn showroom)..."
                  className="flex-1 rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2 text-xs text-white placeholder:text-zinc-500"
                />
                <button
                  type="button"
                  disabled={savingId === lead.id}
                  onClick={() => handleSaveNotes(lead.id)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-zinc-200 shrink-0"
                >
                  <Save className="w-3.5 h-3.5 text-[#e2ad21]" />
                  <span>Lưu ghi chú</span>
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-[#12151b] p-8 text-center text-sm text-zinc-500">
            Chưa có yêu cầu liên hệ nào khớp với bộ lọc hiện tại.
          </div>
        )}
      </div>
    </div>
  );
}
