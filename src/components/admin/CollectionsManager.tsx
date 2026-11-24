"use client";

import React, { useState } from "react";
import { Edit2, Plus, Trash2, X } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { slugifyVi, triggerRevalidate } from "@/lib/admin-utils";
import { ImageUploader } from "./ImageUploader";

export interface AdminCollectionRow {
  slug: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  item_count: string;
  image: string;
  hover_image: string | null;
  href: string;
  sort_order: number;
}

export function CollectionsManager({
  initialCollections,
}: {
  initialCollections: AdminCollectionRow[];
}) {
  const [items, setItems] = useState<AdminCollectionRow[]>(initialCollections);
  const [editing, setEditing] = useState<AdminCollectionRow | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCreate = () => {
    setEditing({
      slug: "",
      eyebrow: "Bộ sưu tập 2026",
      title: "",
      subtitle: "",
      item_count: "12",
      image: "/images/hero-leather.jpg",
      hover_image: "/images/room-living.jpg",
      href: "/danh-muc/tat-ca",
      sort_order: items.length + 1,
    });
    setIsCreating(true);
    setError(null);
  };

  const openEdit = (row: AdminCollectionRow) => {
    setEditing({ ...row });
    setIsCreating(false);
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const finalSlug = editing.slug.trim() || slugifyVi(editing.title);
    if (!editing.title.trim() || !finalSlug) {
      setError("Vui lòng nhập tên bộ sưu tập và slug.");
      return;
    }

    setSaving(true);
    setError(null);
    const payload: AdminCollectionRow = {
      ...editing,
      slug: finalSlug,
      title: editing.title.trim(),
      hover_image: editing.hover_image?.trim() || null,
    };

    try {
      const supabase = createBrowserSupabaseClient();
      const { error: dbErr } = await supabase
        .from("collections")
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
      await triggerRevalidate(["/bo-suu-tap", `/bo-suu-tap/${payload.slug}`]);
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: AdminCollectionRow) => {
    if (!window.confirm(`Xóa bộ sưu tập "${row.title}"?`)) return;
    const supabase = createBrowserSupabaseClient();
    const { error: delErr } = await supabase
      .from("collections")
      .delete()
      .eq("slug", row.slug);
    if (delErr) {
      window.alert(delErr.message);
      return;
    }
    setItems((prev) => prev.filter((c) => c.slug !== row.slug));
    await triggerRevalidate(["/bo-suu-tap"]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý bộ sưu tập</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Hiển thị trên trang /bo-suu-tap và điều hướng khám phá theo phong cách.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-[#e2ad21] hover:bg-[#d19b16] px-4 py-2.5 text-sm font-bold text-[#141619] self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm bộ sưu tập</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((col) => (
          <div
            key={col.slug}
            className="rounded-2xl border border-zinc-800 bg-[#12151b] overflow-hidden flex flex-col"
          >
            <div className="h-44 bg-zinc-900 relative">
              <img
                src={col.image}
                alt={col.title}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/75 text-[#e2ad21]">
                {col.item_count}
              </span>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-zinc-400">
                  {col.eyebrow}
                </p>
                <h2 className="font-bold text-white text-base mt-0.5">
                  {col.title}
                </h2>
                <p className="text-xs text-zinc-400 line-clamp-2 mt-1.5">
                  {col.subtitle}
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                <span className="text-xs text-zinc-500">/{col.slug}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(col)}
                    className="p-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:text-[#e2ad21]"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(col)}
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
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-[#12151b] p-6 my-8 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h2 className="text-lg font-bold text-white">
                {isCreating ? "Thêm bộ sưu tập mới" : `Chỉnh sửa: ${editing.title}`}
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
                    Tên bộ sưu tập *
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
                    Nhãn trên (Eyebrow)
                  </label>
                  <input
                    type="text"
                    value={editing.eyebrow}
                    onChange={(e) =>
                      setEditing({ ...editing, eyebrow: e.target.value })
                    }
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                    Số lượng thiết kế
                  </label>
                  <input
                    type="text"
                    value={editing.item_count}
                    onChange={(e) =>
                      setEditing({ ...editing, item_count: e.target.value })
                    }
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                    Liên kết danh mục (/danh-muc/...)
                  </label>
                  <input
                    type="text"
                    required
                    value={editing.href}
                    onChange={(e) =>
                      setEditing({ ...editing, href: e.target.value })
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

              <ImageUploader
                label="Ảnh chính"
                value={editing.image}
                folder="collections"
                onChange={(image) => setEditing({ ...editing, image })}
              />

              <ImageUploader
                label="Ảnh phụ khi Hover"
                value={editing.hover_image ?? ""}
                folder="collections"
                onChange={(hover_image) =>
                  setEditing({ ...editing, hover_image })
                }
              />

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                  Mô tả ngắn
                </label>
                <textarea
                  rows={3}
                  value={editing.subtitle}
                  onChange={(e) =>
                    setEditing({ ...editing, subtitle: e.target.value })
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
                  {saving ? "Đang lưu..." : "Lưu bộ sưu tập"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
