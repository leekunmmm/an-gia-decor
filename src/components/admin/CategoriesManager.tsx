"use client";

import React, { useMemo, useState } from "react";
import { Edit2, Plus, Trash2, X } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { productGroups } from "@/data/categories";
import {
  arrayToLines,
  linesToArray,
  slugifyVi,
  triggerRevalidate,
} from "@/lib/admin-utils";
import { ImageUploader } from "./ImageUploader";

export interface AdminCategoryRow {
  slug: string;
  title: string;
  group_id: string;
  group_name: string;
  banner_image: string;
  preview_image: string;
  subcategories: string[];
  description: string;
  sort_order: number;
}

export function CategoriesManager({
  initialCategories,
}: {
  initialCategories: AdminCategoryRow[];
}) {
  const [items, setItems] = useState<AdminCategoryRow[]>(initialCategories);
  const [groupFilter, setGroupFilter] = useState("all");
  const [editing, setEditing] = useState<AdminCategoryRow | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [subText, setSubText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (groupFilter === "all") return items;
    return items.filter((c) => c.group_id === groupFilter);
  }, [groupFilter, items]);

  const openCreate = () => {
    const firstGroup = productGroups[0];
    setEditing({
      slug: "",
      title: "",
      group_id: firstGroup.id,
      group_name: firstGroup.name,
      banner_image: "/images/hero-classic.jpg",
      preview_image: "/images/sofa-nordic.jpg",
      subcategories: [],
      description: "",
      sort_order: items.length + 1,
    });
    setSubText("");
    setIsCreating(true);
    setError(null);
  };

  const openEdit = (row: AdminCategoryRow) => {
    setEditing({ ...row });
    setSubText(arrayToLines(row.subcategories));
    setIsCreating(false);
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const finalSlug = editing.slug.trim() || slugifyVi(editing.title);
    if (!editing.title.trim() || !finalSlug) {
      setError("Vui lòng nhập tên danh mục và slug.");
      return;
    }

    setSaving(true);
    setError(null);
    const payload: AdminCategoryRow = {
      ...editing,
      slug: finalSlug,
      title: editing.title.trim(),
      subcategories: linesToArray(subText),
    };

    try {
      const supabase = createBrowserSupabaseClient();
      const { error: dbErr } = await supabase
        .from("categories")
        .upsert(payload, { onConflict: "slug" });
      if (dbErr) {
        setError(dbErr.message);
        return;
      }

      setItems((prev) => {
        const exists = prev.some((c) => c.slug === payload.slug);
        const next = exists
          ? prev.map((c) => (c.slug === payload.slug ? payload : c))
          : [...prev, payload];
        return [...next].sort((a, b) => a.sort_order - b.sort_order);
      });
      await triggerRevalidate([`/danh-muc/${payload.slug}`, "/danh-muc/tat-ca"]);
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: AdminCategoryRow) => {
    if (!window.confirm(`Xóa danh mục "${row.title}"?`)) return;
    const supabase = createBrowserSupabaseClient();
    const { error: delErr } = await supabase
      .from("categories")
      .delete()
      .eq("slug", row.slug);
    if (delErr) {
      window.alert(delErr.message);
      return;
    }
    setItems((prev) => prev.filter((c) => c.slug !== row.slug));
    await triggerRevalidate(["/danh-muc/tat-ca"]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý danh mục</h1>
          <p className="text-sm text-zinc-400 mt-1">
            {items.length} danh mục phân bổ theo 5 nhóm không gian.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-[#e2ad21] hover:bg-[#d19b16] px-4 py-2.5 text-sm font-bold text-[#141619] transition-colors self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm danh mục</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setGroupFilter("all")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            groupFilter === "all"
              ? "bg-[#e2ad21] text-[#141619] border-[#e2ad21]"
              : "bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-zinc-500"
          }`}
        >
          Tất cả ({items.length})
        </button>
        {productGroups.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setGroupFilter(g.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              groupFilter === g.id
                ? "bg-[#e2ad21] text-[#141619] border-[#e2ad21]"
                : "bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-zinc-500"
            }`}
          >
            {g.name} ({items.filter((i) => i.group_id === g.id).length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((cat) => (
          <div
            key={cat.slug}
            className="rounded-2xl border border-zinc-800 bg-[#12151b] overflow-hidden flex flex-col"
          >
            <div className="h-36 bg-zinc-900 relative">
              <img
                src={cat.preview_image}
                alt={cat.title}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/75 text-[#e2ad21]">
                {cat.group_name}
              </span>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between gap-3">
              <div>
                <h2 className="font-bold text-white text-base">{cat.title}</h2>
                <p className="text-xs text-zinc-500 mt-0.5">/{cat.slug}</p>
                <p className="text-xs text-zinc-400 line-clamp-2 mt-2">
                  {cat.description}
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                <span className="text-xs text-zinc-400">
                  {cat.subcategories.length} nhóm con · #{cat.sort_order}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(cat)}
                    className="p-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:text-[#e2ad21]"
                    title="Chỉnh sửa"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(cat)}
                    className="p-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:text-red-400"
                    title="Xóa"
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
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-[#12151b] p-6 my-8 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h2 className="text-lg font-bold text-white">
                {isCreating ? "Thêm danh mục mới" : `Chỉnh sửa: ${editing.title}`}
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
                    Tên danh mục *
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
                    Nhóm không gian
                  </label>
                  <select
                    value={editing.group_id}
                    onChange={(e) => {
                      const grp = productGroups.find(
                        (g) => g.id === e.target.value
                      );
                      if (!grp) return;
                      setEditing({
                        ...editing,
                        group_id: grp.id,
                        group_name: grp.name,
                      });
                    }}
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                  >
                    {productGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                    Thứ tự sắp xếp
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

              <ImageUploader
                label="Ảnh đại diện (Preview)"
                value={editing.preview_image}
                folder="categories"
                onChange={(preview_image) =>
                  setEditing({ ...editing, preview_image })
                }
              />

              <ImageUploader
                label="Ảnh Banner trang danh mục"
                value={editing.banner_image}
                folder="categories"
                onChange={(banner_image) =>
                  setEditing({ ...editing, banner_image })
                }
              />

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                  Dòng con / Subcategories (mỗi dòng 1 mục)
                </label>
                <textarea
                  rows={3}
                  value={subText}
                  onChange={(e) => setSubText(e.target.value)}
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                  Mô tả ngắn
                </label>
                <textarea
                  rows={3}
                  value={editing.description}
                  onChange={(e) =>
                    setEditing({ ...editing, description: e.target.value })
                  }
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
                  {saving ? "Đang lưu..." : "Lưu danh mục"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
