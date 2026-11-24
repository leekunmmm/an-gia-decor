"use client";

import React, { useMemo, useState } from "react";
import { Edit2, ExternalLink, Plus, Search, Trash2, X } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  arrayToLines,
  linesToArray,
  slugifyVi,
  triggerRevalidate,
} from "@/lib/admin-utils";
import { ImageUploader, MultiImageUploader } from "./ImageUploader";

export interface AdminProductRow {
  slug: string;
  name: string;
  category_slug: string;
  category_name: string;
  group_id: string;
  group_name: string;
  is_new: boolean;
  price_label: string;
  images: string[];
  application_image: string;
  description: string;
  highlights: string[];
  colors: string[];
  suitable_spaces: string[];
  dimensions_and_materials: string;
  care_instructions: string;
  related_slugs: string[];
  is_published: boolean;
  sort_order: number;
}

export interface AdminCategoryOption {
  slug: string;
  title: string;
  group_id: string;
  group_name: string;
}

export function ProductsManager({
  initialProducts,
  categories,
}: {
  initialProducts: AdminProductRow[];
  categories: AdminCategoryOption[];
}) {
  const [items, setItems] = useState<AdminProductRow[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [editing, setEditing] = useState<AdminProductRow | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [highlightsText, setHighlightsText] = useState("");
  const [colorsText, setColorsText] = useState("");
  const [spacesText, setSpacesText] = useState("");
  const [relatedText, setRelatedText] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      if (filterCat !== "all" && p.category_slug !== filterCat) return false;
      if (
        q &&
        !`${p.name} ${p.slug} ${p.category_name}`.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [filterCat, items, search]);

  const openCreate = () => {
    const firstCat = categories[0] ?? {
      slug: "sofa-bac-au",
      title: "Sofa Bắc Âu",
      group_id: "living",
      group_name: "Phòng khách",
    };
    const blank: AdminProductRow = {
      slug: "",
      name: "",
      category_slug: firstCat.slug,
      category_name: firstCat.title,
      group_id: firstCat.group_id,
      group_name: firstCat.group_name,
      is_new: true,
      price_label: "Liên hệ",
      images: ["/images/sofa-nordic.jpg"],
      application_image: "/images/room-living.jpg",
      description: "",
      highlights: [],
      colors: [],
      suitable_spaces: ["Phòng khách"],
      dimensions_and_materials: "",
      care_instructions: "",
      related_slugs: [],
      is_published: true,
      sort_order: items.length + 1,
    };
    setEditing(blank);
    setHighlightsText("");
    setColorsText("");
    setSpacesText("Phòng khách");
    setRelatedText("");
    setIsCreating(true);
    setError(null);
  };

  const openEdit = (row: AdminProductRow) => {
    setEditing({ ...row });
    setHighlightsText(arrayToLines(row.highlights));
    setColorsText(arrayToLines(row.colors));
    setSpacesText(arrayToLines(row.suitable_spaces));
    setRelatedText(arrayToLines(row.related_slugs));
    setIsCreating(false);
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const finalSlug = editing.slug.trim() || slugifyVi(editing.name);
    if (!editing.name.trim() || !finalSlug) {
      setError("Vui lòng nhập tên sản phẩm và đường dẫn slug.");
      return;
    }

    setSaving(true);
    setError(null);
    const payload: AdminProductRow = {
      ...editing,
      slug: finalSlug,
      name: editing.name.trim(),
      highlights: linesToArray(highlightsText),
      colors: linesToArray(colorsText),
      suitable_spaces: linesToArray(spacesText),
      related_slugs: linesToArray(relatedText),
      images:
        editing.images.length > 0
          ? editing.images
          : ["/images/sofa-nordic.jpg"],
    };

    try {
      const supabase = createBrowserSupabaseClient();
      const { error: dbErr } = await supabase
        .from("products")
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
        `/san-pham/${payload.slug}`,
        `/danh-muc/${payload.category_slug}`,
        "/danh-muc/tat-ca",
      ]);
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: AdminProductRow) => {
    if (!window.confirm(`Xóa sản phẩm "${row.name}"?`)) return;
    const supabase = createBrowserSupabaseClient();
    const { error: delErr } = await supabase
      .from("products")
      .delete()
      .eq("slug", row.slug);
    if (delErr) {
      window.alert(delErr.message);
      return;
    }
    setItems((prev) => prev.filter((p) => p.slug !== row.slug));
    await triggerRevalidate(["/danh-muc/tat-ca", `/danh-muc/${row.category_slug}`]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý sản phẩm</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Tổng cộng {items.length} sản phẩm trong catalogue.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-[#e2ad21] hover:bg-[#d19b16] px-4 py-2.5 text-sm font-bold text-[#141619] transition-colors self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm sản phẩm</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, slug hoặc danh mục..."
            className="w-full rounded-xl bg-[#12151b] border border-zinc-800 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#e2ad21]"
          />
        </div>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="rounded-xl bg-[#12151b] border border-zinc-800 px-3.5 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-[#e2ad21]"
        >
          <option value="all">Tất cả danh mục ({categories.length})</option>
          {categories.map((cat) => (
            <option key={cat.slug} value={cat.slug}>
              {cat.title}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-zinc-800 bg-[#12151b] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase tracking-wider text-zinc-400 bg-zinc-900/70">
              <tr>
                <th className="px-4 py-3">Sản phẩm</th>
                <th className="px-4 py-3">Danh mục</th>
                <th className="px-4 py-3">Giá hiển thị</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {filtered.map((item) => (
                <tr key={item.slug} className="hover:bg-zinc-900/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.images[0] || "/images/sofa-nordic.jpg"}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover border border-zinc-800 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate max-w-xs">
                          {item.name}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">
                          /{item.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    <p>{item.category_name}</p>
                    <p className="text-xs text-zinc-500">{item.group_name}</p>
                  </td>
                  <td className="px-4 py-3 font-medium text-[#e2ad21]">
                    {item.price_label}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          item.is_published
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-zinc-700/60 text-zinc-400"
                        }`}
                      >
                        {item.is_published ? "Hiển thị" : "Ẩn"}
                      </span>
                      {item.is_new && (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-[#e2ad21]/15 text-[#e2ad21]">
                          Mới
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/san-pham/${item.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Xem sản phẩm"
                        className="p-2 rounded-lg border border-zinc-700/80 text-zinc-300 hover:text-white hover:border-zinc-500"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        title="Chỉnh sửa"
                        className="p-2 rounded-lg border border-zinc-700/80 text-zinc-300 hover:text-[#e2ad21] hover:border-[#e2ad21]/50"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        title="Xóa"
                        className="p-2 rounded-lg border border-zinc-700/80 text-zinc-300 hover:text-red-400 hover:border-red-500/50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    Không tìm thấy sản phẩm phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl border border-zinc-800 bg-[#12151b] p-6 my-8 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h2 className="text-lg font-bold text-white">
                {isCreating ? "Thêm sản phẩm mới" : `Chỉnh sửa: ${editing.name}`}
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
                    Tên sản phẩm *
                  </label>
                  <input
                    type="text"
                    required
                    value={editing.name}
                    onChange={(e) => {
                      const nextName = e.target.value;
                      setEditing((prev) =>
                        prev
                          ? {
                              ...prev,
                              name: nextName,
                              ...(isCreating ? { slug: slugifyVi(nextName) } : {}),
                            }
                          : null
                      );
                    }}
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                    Đường dẫn Slug *
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
                    Danh mục *
                  </label>
                  <select
                    value={editing.category_slug}
                    onChange={(e) => {
                      const matched = categories.find(
                        (c) => c.slug === e.target.value
                      );
                      if (!matched) return;
                      setEditing({
                        ...editing,
                        category_slug: matched.slug,
                        category_name: matched.title,
                        group_id: matched.group_id,
                        group_name: matched.group_name,
                      });
                    }}
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat.slug} value={cat.slug}>
                        {cat.title} ({cat.group_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                    Giá hiển thị
                  </label>
                  <input
                    type="text"
                    value={editing.price_label}
                    onChange={(e) =>
                      setEditing({ ...editing, price_label: e.target.value })
                    }
                    placeholder="28.500.000₫ hoặc Liên hệ"
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 py-1">
                <label className="inline-flex items-center gap-2 text-sm text-zinc-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.is_published}
                    onChange={(e) =>
                      setEditing({ ...editing, is_published: e.target.checked })
                    }
                  />
                  <span>Hiển thị trên website</span>
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-zinc-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.is_new}
                    onChange={(e) =>
                      setEditing({ ...editing, is_new: e.target.checked })
                    }
                  />
                  <span>Gắn nhãn Sản phẩm mới</span>
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

              <MultiImageUploader
                label="Bộ ảnh sản phẩm"
                values={editing.images}
                folder="products"
                onChange={(images) => setEditing({ ...editing, images })}
              />

              <ImageUploader
                label="Ảnh phối cảnh thực tế (Application)"
                value={editing.application_image}
                folder="products"
                onChange={(application_image) =>
                  setEditing({ ...editing, application_image })
                }
              />

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                  Mô tả sản phẩm
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                    Điểm nổi bật (mỗi dòng 1 ý)
                  </label>
                  <textarea
                    rows={4}
                    value={highlightsText}
                    onChange={(e) => setHighlightsText(e.target.value)}
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                    Bảng màu / Tùy chọn (mỗi dòng 1 màu)
                  </label>
                  <textarea
                    rows={4}
                    value={colorsText}
                    onChange={(e) => setColorsText(e.target.value)}
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                    Không gian phù hợp (mỗi dòng 1 mục)
                  </label>
                  <textarea
                    rows={3}
                    value={spacesText}
                    onChange={(e) => setSpacesText(e.target.value)}
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                    Slug sản phẩm liên quan (mỗi dòng 1 slug)
                  </label>
                  <textarea
                    rows={3}
                    value={relatedText}
                    onChange={(e) => setRelatedText(e.target.value)}
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                  Kích thước &amp; Vật liệu
                </label>
                <textarea
                  rows={2}
                  value={editing.dimensions_and_materials}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      dimensions_and_materials: e.target.value,
                    })
                  }
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                  Hướng dẫn bảo quản
                </label>
                <textarea
                  rows={2}
                  value={editing.care_instructions}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      care_instructions: e.target.value,
                    })
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
                  {saving ? "Đang lưu..." : "Lưu sản phẩm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
