"use client";

import React, { useMemo, useState } from "react";
import { Edit2, ExternalLink, Plus, Trash2, X } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  arrayToLines,
  linesToArray,
  slugifyVi,
  triggerRevalidate,
} from "@/lib/admin-utils";
import { ImageUploader, MultiImageUploader } from "./ImageUploader";

export interface AdminProjectRow {
  slug: string;
  title: string;
  type: "nha-pho" | "van-phong" | "cua-hang";
  type_label: string;
  location: string;
  year: string;
  area: string;
  featured: boolean;
  cover_image: string;
  gallery: string[];
  summary: string;
  scope: string[];
  sort_order: number;
}

const TYPE_OPTIONS: Array<{
  value: AdminProjectRow["type"];
  label: string;
}> = [
  { value: "nha-pho", label: "Nhà phố" },
  { value: "van-phong", label: "Văn phòng" },
  { value: "cua-hang", label: "Cửa hàng" },
];

export function ProjectsManager({
  initialProjects,
}: {
  initialProjects: AdminProjectRow[];
}) {
  const [items, setItems] = useState<AdminProjectRow[]>(initialProjects);
  const [filterType, setFilterType] = useState<string>("all");
  const [editing, setEditing] = useState<AdminProjectRow | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [scopeText, setScopeText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filterType === "all") return items;
    return items.filter((p) => p.type === filterType);
  }, [filterType, items]);

  const openCreate = () => {
    setEditing({
      slug: "",
      title: "",
      type: "nha-pho",
      type_label: "Nhà phố",
      location: "TP.HCM",
      year: "2026",
      area: "180m2",
      featured: false,
      cover_image: "/images/project-villa.jpg",
      gallery: ["/images/project-villa.jpg"],
      summary: "",
      scope: [],
      sort_order: items.length + 1,
    });
    setScopeText("");
    setIsCreating(true);
    setError(null);
  };

  const openEdit = (row: AdminProjectRow) => {
    setEditing({ ...row });
    setScopeText(arrayToLines(row.scope));
    setIsCreating(false);
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const finalSlug = editing.slug.trim() || slugifyVi(editing.title);
    if (!editing.title.trim() || !finalSlug) {
      setError("Vui lòng nhập tên dự án và slug.");
      return;
    }

    setSaving(true);
    setError(null);
    const payload: AdminProjectRow = {
      ...editing,
      slug: finalSlug,
      title: editing.title.trim(),
      scope: linesToArray(scopeText),
      gallery:
        editing.gallery.length > 0 ? editing.gallery : [editing.cover_image],
    };

    try {
      const supabase = createBrowserSupabaseClient();
      const { error: dbErr } = await supabase
        .from("projects")
        .upsert(payload, { onConflict: "slug" });
      if (dbErr) {
        setError(dbErr.message);
        return;
      }

      setItems((prev) => {
        const exists = prev.some((p) => p.slug === payload.slug);
        const next = exists
          ? prev.map((p) => (p.slug === payload.slug ? payload : p))
          : [...prev, payload];
        return [...next].sort((a, b) => a.sort_order - b.sort_order);
      });
      await triggerRevalidate([
        "/",
        "/du-an",
        `/du-an/loai/${payload.type}`,
        `/du-an/${payload.slug}`,
      ]);
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: AdminProjectRow) => {
    if (!window.confirm(`Xóa dự án "${row.title}"?`)) return;
    const supabase = createBrowserSupabaseClient();
    const { error: delErr } = await supabase
      .from("projects")
      .delete()
      .eq("slug", row.slug);
    if (delErr) {
      window.alert(delErr.message);
      return;
    }
    setItems((prev) => prev.filter((p) => p.slug !== row.slug));
    await triggerRevalidate(["/", "/du-an", `/du-an/loai/${row.type}`]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý dự án</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Tổng cộng {items.length} dự án hoàn thiện thực tế.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-[#e2ad21] hover:bg-[#d19b16] px-4 py-2.5 text-sm font-bold text-[#141619] self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm dự án</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilterType("all")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            filterType === "all"
              ? "bg-[#e2ad21] text-[#141619] border-[#e2ad21]"
              : "bg-zinc-900 text-zinc-300 border-zinc-700"
          }`}
        >
          Tất cả ({items.length})
        </button>
        {TYPE_OPTIONS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setFilterType(t.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              filterType === t.value
                ? "bg-[#e2ad21] text-[#141619] border-[#e2ad21]"
                : "bg-zinc-900 text-zinc-300 border-zinc-700"
            }`}
          >
            {t.label} ({items.filter((i) => i.type === t.value).length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((prj) => (
          <div
            key={prj.slug}
            className="rounded-2xl border border-zinc-800 bg-[#12151b] overflow-hidden flex flex-col"
          >
            <div className="h-44 bg-zinc-900 relative">
              <img
                src={prj.cover_image}
                alt={prj.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 flex gap-1.5">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/75 text-[#e2ad21]">
                  {prj.type_label}
                </span>
                {prj.featured && (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#e2ad21] text-[#141619]">
                    Tiêu biểu
                  </span>
                )}
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between gap-3">
              <div>
                <h2 className="font-bold text-white text-base">{prj.title}</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  {prj.location} · {prj.area} · {prj.year}
                </p>
                <p className="text-xs text-zinc-500 line-clamp-2 mt-1.5">
                  {prj.summary}
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                <a
                  href={`/du-an/${prj.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white"
                >
                  <span>Xem chi tiết</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(prj)}
                    className="p-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:text-[#e2ad21]"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(prj)}
                    className="p-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl border border-zinc-800 bg-[#12151b] p-6 my-8 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h2 className="text-lg font-bold text-white">
                {isCreating ? "Thêm dự án mới" : `Chỉnh sửa: ${editing.title}`}
              </h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                    Tên công trình *
                  </label>
                  <input
                    type="text"
                    required
                    value={editing.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setEditing((prev) =>
                        prev
                          ? {
                              ...prev,
                              title,
                              ...(isCreating ? { slug: slugifyVi(title) } : {}),
                            }
                          : null
                      );
                    }}
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isCreating}
                    value={editing.slug}
                    onChange={(e) =>
                      setEditing({ ...editing, slug: slugifyVi(e.target.value) })
                    }
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                    Loại hình công trình
                  </label>
                  <select
                    value={editing.type}
                    onChange={(e) => {
                      const opt = TYPE_OPTIONS.find(
                        (o) => o.value === e.target.value
                      );
                      if (!opt) return;
                      setEditing({
                        ...editing,
                        type: opt.value,
                        type_label: opt.label,
                      });
                    }}
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                  >
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                    Địa điểm
                  </label>
                  <input
                    type="text"
                    value={editing.location}
                    onChange={(e) =>
                      setEditing({ ...editing, location: e.target.value })
                    }
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                    Diện tích
                  </label>
                  <input
                    type="text"
                    value={editing.area}
                    onChange={(e) =>
                      setEditing({ ...editing, area: e.target.value })
                    }
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                      Năm hoàn thiện
                    </label>
                    <input
                      type="text"
                      value={editing.year}
                      onChange={(e) =>
                        setEditing({ ...editing, year: e.target.value })
                      }
                      className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                      Thứ tự
                    </label>
                    <input
                      type="number"
                      value={editing.sort_order}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          sort_order: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-zinc-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.featured}
                  onChange={(e) =>
                    setEditing({ ...editing, featured: e.target.checked })
                  }
                />
                <span>Đánh dấu Dự án tiêu biểu</span>
              </label>

              <ImageUploader
                label="Ảnh bìa dự án"
                value={editing.cover_image}
                folder="projects"
                onChange={(cover_image) =>
                  setEditing({ ...editing, cover_image })
                }
              />

              <MultiImageUploader
                label="Album ảnh thực tế công trình"
                values={editing.gallery}
                folder="projects"
                onChange={(gallery) => setEditing({ ...editing, gallery })}
              />

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                  Tóm tắt công trình
                </label>
                <textarea
                  rows={3}
                  value={editing.summary}
                  onChange={(e) =>
                    setEditing({ ...editing, summary: e.target.value })
                  }
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                  Hạng mục thi công / Nội thất cung cấp (mỗi dòng 1 hạng mục)
                </label>
                <textarea
                  rows={4}
                  value={scopeText}
                  onChange={(e) => setScopeText(e.target.value)}
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                />
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#e2ad21] hover:bg-[#d19b16] px-5 py-2 text-sm font-bold text-[#141619] disabled:opacity-60"
                >
                  {saving ? "Đang lưu..." : "Lưu dự án"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
