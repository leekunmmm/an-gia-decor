"use client";

import React, { useState } from "react";
import { CheckCircle2, Save } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { triggerRevalidate } from "@/lib/admin-utils";
import { ImageUploader } from "./ImageUploader";

export interface AdminSettingsRow {
  id: number;
  name: string;
  short_name: string;
  sub_name: string;
  monogram: string;
  domain: string;
  tagline: string;
  description: string;
  hotline: string;
  hotline_raw: string;
  email: string;
  zalo_url: string;
  messenger_url: string;
  tiktok_url: string;
  shopee_url: string;
  address: string;
  hours: string;
  map_embed_url: string;
  experience_stat: string;
  experience_label: string;
  copyright_year: string;
  logo_horizontal: string;
  logo_stacked: string;
  logo_mark: string;
}

export function SettingsManager({
  initialSettings,
}: {
  initialSettings: AdminSettingsRow;
}) {
  const [form, setForm] = useState<AdminSettingsRow>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedOk(false);
    setError(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error: dbErr } = await supabase
        .from("site_settings")
        .upsert({ ...form, id: 1 }, { onConflict: "id" });

      if (dbErr) {
        setError(dbErr.message);
        return;
      }

      await triggerRevalidate(["/"]);
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Cài đặt thương hiệu &amp; Kênh liên hệ
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Thay đổi tại đây sẽ cập nhật trực tiếp lên Header, Footer, nút liên hệ nhanh Messenger/Zalo/Shopee, Hotline và SEO toàn trang.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Kênh liên hệ & Mạng xã hội */}
        <section className="rounded-2xl border border-zinc-800 bg-[#12151b] p-6 space-y-4">
          <h2 className="text-base font-bold text-[#e2ad21]">
            1. Kênh liên hệ &amp; Bán hàng trực tuyến
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                Số Hotline hiển thị
              </label>
              <input
                type="text"
                required
                value={form.hotline}
                onChange={(e) => setForm({ ...form, hotline: e.target.value })}
                className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                Hotline gọi (tel:)
              </label>
              <input
                type="text"
                required
                value={form.hotline_raw}
                onChange={(e) =>
                  setForm({ ...form, hotline_raw: e.target.value })
                }
                className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                Link Messenger (Fanpage)
              </label>
              <input
                type="url"
                value={form.messenger_url}
                onChange={(e) =>
                  setForm({ ...form, messenger_url: e.target.value })
                }
                placeholder="https://m.me/angiadecor"
                className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                Link Zalo OA / Cá nhân
              </label>
              <input
                type="url"
                value={form.zalo_url}
                onChange={(e) => setForm({ ...form, zalo_url: e.target.value })}
                placeholder="https://zalo.me/..."
                className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                Link Gian hàng Shopee
              </label>
              <input
                type="url"
                value={form.shopee_url}
                onChange={(e) =>
                  setForm({ ...form, shopee_url: e.target.value })
                }
                placeholder="https://shopee.vn/..."
                className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                Link TikTok
              </label>
              <input
                type="url"
                value={form.tiktok_url}
                onChange={(e) =>
                  setForm({ ...form, tiktok_url: e.target.value })
                }
                placeholder="https://www.tiktok.com/@..."
                className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
              />
            </div>
          </div>
        </section>

        {/* Thông tin showroom & SEO */}
        <section className="rounded-2xl border border-zinc-800 bg-[#12151b] p-6 space-y-4">
          <h2 className="text-base font-bold text-[#e2ad21]">
            2. Thông tin thương hiệu, Showroom &amp; SEO
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                Tên thương hiệu
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                Domain website
              </label>
              <input
                type="text"
                required
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
                className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                Tagline (Title mặc định)
              </label>
              <input
                type="text"
                required
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                Email liên hệ
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                Địa chỉ Showroom
              </label>
              <input
                type="text"
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                Giờ mở cửa
              </label>
              <input
                type="text"
                required
                value={form.hours}
                onChange={(e) => setForm({ ...form, hours: e.target.value })}
                className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                Mô tả SEO (Meta Description mặc định)
              </label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                Google Maps Embed URL
              </label>
              <input
                type="url"
                value={form.map_embed_url}
                onChange={(e) =>
                  setForm({ ...form, map_embed_url: e.target.value })
                }
                className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                Số liệu kinh nghiệm (VD: 10+)
              </label>
              <input
                type="text"
                value={form.experience_stat}
                onChange={(e) =>
                  setForm({ ...form, experience_stat: e.target.value })
                }
                className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                Nhãn kinh nghiệm
              </label>
              <input
                type="text"
                value={form.experience_label}
                onChange={(e) =>
                  setForm({ ...form, experience_label: e.target.value })
                }
                className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
              />
            </div>
          </div>
        </section>

        {/* Bộ 3 Logo */}
        <section className="rounded-2xl border border-zinc-800 bg-[#12151b] p-6 space-y-4">
          <h2 className="text-base font-bold text-[#e2ad21]">
            3. Bộ 3 Logo thương hiệu
          </h2>
          <ImageUploader
            label="Logo ngang (Header)"
            value={form.logo_horizontal}
            folder="logos"
            onChange={(logo_horizontal) =>
              setForm({ ...form, logo_horizontal })
            }
          />
          <ImageUploader
            label="Logo dọc / Full (Footer)"
            value={form.logo_stacked}
            folder="logos"
            onChange={(logo_stacked) => setForm({ ...form, logo_stacked })}
          />
          <ImageUploader
            label="Biểu tượng Mark / Favicon"
            value={form.logo_mark}
            folder="logos"
            onChange={(logo_mark) => setForm({ ...form, logo_mark })}
          />
        </section>

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-4">
          {savedOk && (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Đã lưu cấu hình và đồng bộ lên website!</span>
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#e2ad21] hover:bg-[#d19b16] px-6 py-2.5 text-sm font-bold text-[#141619] disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Đang lưu..." : "Lưu cài đặt thương hiệu"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
