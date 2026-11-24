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
import { ImageUploader } from "./ImageUploader";

export interface AdminArticleRow {
  id?: string;
  slug: string;
  kind: "library" | "news";
  title: string;
  category: string;
  date: string;
  read_time: string;
  excerpt: string;
  cover_image: string;
  is_hero: boolean;
  key_points: string[];
  source_label: string | null;
  source_url: string | null;
  sections: { heading: string; paragraphs: string[] }[];
  is_published: boolean;
  sort_order: number;
}

export function ArticlesManager({
  initialArticles,
}: {
  initialArticles: AdminArticleRow[];
}) {
  const [items, setItems] = useState<AdminArticleRow[]>(initialArticles);
  const [activeKind, setActiveKind] = useState<"library" | "news">("library");
  const [editing, setEditing] = useState<AdminArticleRow | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [keyPointsText, setKeyPointsText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(
    () => items.filter((a) => a.kind === activeKind),
    [activeKind, items]
  );

  const openCreate = () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();

    setEditing({
      slug: "",
      kind: activeKind,
      title: "",
      category: activeKind === "library" ? "Chất liệu" : "Sự kiện Showroom",
      date: `${dd}/${mm}/${yyyy}`,
      read_time: "5 phút đọc",
      excerpt: "",
      cover_image: "/images/craftsmanship-studio.jpg",
      is_hero: false,
      key_points: [],
      source_label: "An Gia Decor Studio",
      source_url: "",
      sections: [{ heading: "Tổng quan", paragraphs: [""] }],
      is_published: true,
      sort_order: filtered.length + 1,
    });
    setKeyPointsText("");
    setIsCreating(true);
    setError(null);
  };

  const openEdit = (row: AdminArticleRow) => {
    setEditing({
      ...row,
      sections: Array.isArray(row.sections) ? [...row.sections] : [],
    });
    setKeyPointsText(arrayToLines(row.key_points));
    setIsCreating(false);
    setError(null);
  };

  const updateSectionHeading = (idx: number, heading: string) => {
    if (!editing) return;
    const next = [...editing.sections];
    next[idx] = { ...next[idx], heading };
    setEditing({ ...editing, sections: next });
  };

  const updateSectionParagraphs = (idx: number, text: string) => {
    if (!editing) return;
    const next = [...editing.sections];
    next[idx] = { ...next[idx], paragraphs: linesToArray(text) };
    setEditing({ ...editing, sections: next });
  };

  const addSection = () => {
    if (!editing) return;
    setEditing({
      ...editing,
      sections: [...editing.sections, { heading: "", paragraphs: [] }],
    });
  };

  const removeSection = (idx: number) => {
    if (!editing) return;
    setEditing({
      ...editing,
      sections: editing.sections.filter((_, i) => i !== idx),
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const finalSlug = editing.slug.trim() || slugifyVi(editing.title);
    if (!editing.title.trim() || !finalSlug) {
      setError("Vui lòng nhập tiêu đề và slug bài viết.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      ...(editing.id ? { id: editing.id } : {}),
      slug: finalSlug,
      kind: editing.kind,
      title: editing.title.trim(),
      category: editing.category.trim(),
      date: editing.date.trim(),
      read_time: editing.read_time.trim(),
      excerpt: editing.excerpt.trim(),
      cover_image: editing.cover_image.trim() || "/images/craftsmanship-studio.jpg",
      is_hero: editing.is_hero,
      key_points: linesToArray(keyPointsText),
      source_label: editing.source_label?.trim() || null,
      source_url: editing.source_url?.trim() || null,
      sections: editing.sections.filter((s) => s.heading.trim() || s.paragraphs.length > 0),
      is_published: editing.is_published,
      sort_order: editing.sort_order,
    };

    try {
      const supabase = createBrowserSupabaseClient();
      const { data: savedRow, error: dbErr } = await supabase
        .from("articles")
        .upsert(payload, { onConflict: "kind,slug" })
        .select("*")
        .single();

      if (dbErr || !savedRow) {
        setError(dbErr?.message || "Lưu bài viết thất bại.");
        return;
      }

      const saved = savedRow as AdminArticleRow;
      setItems((prev) => {
        const exists = prev.some(
          (a) => a.kind === saved.kind && a.slug === saved.slug
        );
        const next = exists
          ? prev.map((a) =>
              a.kind === saved.kind && a.slug === saved.slug ? saved : a
            )
          : [...prev, saved];
        return [...next].sort((a, b) => a.sort_order - b.sort_order);
      });

      const basePath = saved.kind === "library" ? "/thu-vien" : "/tin-tuc";
      await triggerRevalidate(["/", basePath, `${basePath}/${saved.slug}`]);
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: AdminArticleRow) => {
    if (!window.confirm(`Xóa bài viết "${row.title}"?`)) return;
    const supabase = createBrowserSupabaseClient();
    const { error: delErr } = await supabase
      .from("articles")
      .delete()
      .eq("kind", row.kind)
      .eq("slug", row.slug);
    if (delErr) {
      window.alert(delErr.message);
      return;
    }
    setItems((prev) =>
      prev.filter((a) => !(a.kind === row.kind && a.slug === row.slug))
    );
    const basePath = row.kind === "library" ? "/thu-vien" : "/tin-tuc";
    await triggerRevalidate(["/", basePath]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Quản lý Thư viện &amp; Tin tức
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Biên tập bài viết kiến thức vật liệu (/thu-vien) và tin tức showroom (/tin-tuc).
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-[#e2ad21] hover:bg-[#d19b16] px-4 py-2.5 text-sm font-bold text-[#141619] self-start"
        >
          <Plus className="w-4 h-4" />
          <span>
            {activeKind === "library" ? "Thêm bài Thư viện" : "Thêm Tin tức"}
          </span>
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveKind("library")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
            activeKind === "library"
              ? "bg-[#e2ad21] text-[#141619] border-[#e2ad21]"
              : "bg-zinc-900 text-zinc-300 border-zinc-700"
          }`}
        >
          Thư viện ({items.filter((a) => a.kind === "library").length})
        </button>
        <button
          type="button"
          onClick={() => setActiveKind("news")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
            activeKind === "news"
              ? "bg-[#e2ad21] text-[#141619] border-[#e2ad21]"
              : "bg-zinc-900 text-zinc-300 border-zinc-700"
          }`}
        >
          Tin tức ({items.filter((a) => a.kind === "news").length})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((art) => {
          const publicUrl =
            art.kind === "library"
              ? `/thu-vien/${art.slug}`
              : `/tin-tuc/${art.slug}`;
          return (
            <div
              key={`${art.kind}-${art.slug}`}
              className="rounded-2xl border border-zinc-800 bg-[#12151b] p-4 flex gap-4"
            >
              <img
                src={art.cover_image}
                alt={art.title}
                className="w-28 h-24 rounded-xl object-cover shrink-0 border border-zinc-800"
              />
              <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-[#e2ad21] font-semibold">
                      {art.category}
                    </span>
                    <span className="text-zinc-500">· {art.date}</span>
                    {!art.is_published && (
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        Nháp
                      </span>
                    )}
                  </div>
                  <h2 className="font-bold text-white text-sm line-clamp-2 mt-1">
                    {art.title}
                  </h2>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/70">
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white"
                  >
                    <span>Mở bài</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(art)}
                      className="p-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:text-[#e2ad21]"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(art)}
                      className="p-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl border border-zinc-800 bg-[#12151b] p-6 my-8 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h2 className="text-lg font-bold text-white">
                {isCreating ? "Thêm bài viết mới" : `Chỉnh sửa: ${editing.title}`}
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
                    Tiêu đề bài viết *
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
                    Chuyên mục
                  </label>
                  <input
                    type="text"
                    value={editing.category}
                    onChange={(e) =>
                      setEditing({ ...editing, category: e.target.value })
                    }
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                      Ngày đăng
                    </label>
                    <input
                      type="text"
                      value={editing.date}
                      onChange={(e) =>
                        setEditing({ ...editing, date: e.target.value })
                      }
                      className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                      Thời lượng đọc
                    </label>
                    <input
                      type="text"
                      value={editing.read_time}
                      onChange={(e) =>
                        setEditing({ ...editing, read_time: e.target.value })
                      }
                      className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <label className="inline-flex items-center gap-2 text-sm text-zinc-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.is_published}
                    onChange={(e) =>
                      setEditing({ ...editing, is_published: e.target.checked })
                    }
                  />
                  <span>Xuất bản công khai</span>
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-zinc-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.is_hero}
                    onChange={(e) =>
                      setEditing({ ...editing, is_hero: e.target.checked })
                    }
                  />
                  <span>Hiển thị tại cụm Hero nổi bật</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Thứ tự:</span>
                  <input
                    type="number"
                    value={editing.sort_order}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        sort_order: Number(e.target.value) || 0,
                      })
                    }
                    className="w-20 rounded-lg bg-zinc-950 border border-zinc-700 px-2.5 py-1 text-sm text-white"
                  />
                </div>
              </div>

              <ImageUploader
                label="Ảnh bìa bài viết"
                value={editing.cover_image}
                folder="articles"
                onChange={(cover_image) =>
                  setEditing({ ...editing, cover_image })
                }
              />

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                  Đoạn mở đầu / Excerpt
                </label>
                <textarea
                  rows={3}
                  value={editing.excerpt}
                  onChange={(e) =>
                    setEditing({ ...editing, excerpt: e.target.value })
                  }
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                  Điểm nhấn chính (mỗi dòng 1 ý)
                </label>
                <textarea
                  rows={3}
                  value={keyPointsText}
                  onChange={(e) => setKeyPointsText(e.target.value)}
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="space-y-3 border-t border-zinc-800 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-zinc-300">
                    Nội dung chi tiết theo mục ({editing.sections.length})
                  </span>
                  <button
                    type="button"
                    onClick={addSection}
                    className="inline-flex items-center gap-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#e2ad21]" />
                    <span>Thêm mục</span>
                  </button>
                </div>

                {editing.sections.map((sec, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 space-y-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={sec.heading}
                        onChange={(e) =>
                          updateSectionHeading(idx, e.target.value)
                        }
                        placeholder={`Tiêu đề mục ${idx + 1}`}
                        className="flex-1 rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-1.5 text-sm font-semibold text-white"
                      />
                      <button
                        type="button"
                        onClick={() => removeSection(idx)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400"
                        title="Xóa mục này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={arrayToLines(sec.paragraphs)}
                      onChange={(e) =>
                        updateSectionParagraphs(idx, e.target.value)
                      }
                      placeholder="Mỗi dòng là một đoạn văn..."
                      className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                    />
                  </div>
                ))}
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
                  {saving ? "Đang lưu..." : "Lưu bài viết"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
