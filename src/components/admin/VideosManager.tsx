"use client";

import React, { useState } from "react";
import { CheckCircle2, Film, Plus, Save, Trash2 } from "lucide-react";
import type { HeroSlide, SpotlightData, VideoReel } from "@/data/homepage";
import type { HomepageMediaData } from "@/lib/data-service";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { triggerRevalidate } from "@/lib/admin-utils";
import { ImageUploader } from "./ImageUploader";
import { VideoUploader } from "./VideoUploader";

type VideoTab = "hero" | "reels" | "spotlights" | "commitment";

const TABS: { id: VideoTab; label: string }[] = [
  { id: "hero", label: "1. Hero đầu trang" },
  { id: "reels", label: "2. Video Showroom (Reels)" },
  { id: "spotlights", label: "3. Khối Spotlight" },
  { id: "commitment", label: "4. Khối Cam kết Xưởng" },
];

export function VideosManager({
  initialData,
}: {
  initialData: HomepageMediaData;
}) {
  const [tab, setTab] = useState<VideoTab>("hero");
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(
    initialData.heroSlides
  );
  const [videoReels, setVideoReels] = useState<VideoReel[]>(
    initialData.videoReels
  );
  const [spotlightNordic, setSpotlightNordic] = useState<SpotlightData>(
    initialData.spotlightNordic
  );
  const [spotlightWood, setSpotlightWood] = useState<SpotlightData>(
    initialData.spotlightWood
  );
  const [commitmentImage, setCommitmentImage] = useState(
    initialData.commitmentStageImage
  );
  const [commitmentVideoUrl, setCommitmentVideoUrl] = useState(
    initialData.commitmentStageVideoUrl
  );
  const [commitmentCaption, setCommitmentCaption] = useState(
    initialData.commitmentStageCaption
  );

  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateHeroSlide = (idx: number, patch: Partial<HeroSlide>) => {
    setHeroSlides((prev) =>
      prev.map((slide, i) => (i === idx ? { ...slide, ...patch } : slide))
    );
  };

  const addHeroSlide = () => {
    setHeroSlides((prev) => [
      ...prev,
      {
        id: `slide-${Date.now()}`,
        eyebrow: "BỘ SƯU TẬP MỚI · 2026",
        title: "KHÔNG GIAN SỐNG ĐƯƠNG ĐẠI",
        subtitle: "Chế tác theo tỷ lệ thực tế ngôi nhà Việt.",
        ctaLabel: "Khám phá ngay",
        ctaHref: "/danh-muc/tat-ca",
        image: "/images/hero-leather.jpg",
        videoUrl: "/videos/luxury-suite-pan.mp4",
      },
    ]);
  };

  const updateReel = (idx: number, patch: Partial<VideoReel>) => {
    setVideoReels((prev) =>
      prev.map((reel, i) => (i === idx ? { ...reel, ...patch } : reel))
    );
  };

  const addReel = () => {
    setVideoReels((prev) => [
      ...prev,
      {
        id: `tiktok-${Date.now()}`,
        title: "Video mới từ kênh @noithathiendai10",
        duration: "TikTok",
        views: "Mới cập nhật",
        categoryLabel: "Nội thất hiện đại",
        posterImage: "/images/reel-showroom.jpg",
        videoUrl: "",
        tiktokUrl: "https://www.tiktok.com/@noithathiendai10",
        tiktokVideoId: "",
        linkedHref: "/danh-muc/tat-ca",
      },
    ]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedOk(false);
    setError(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error: dbErr } = await supabase.from("homepage_media").upsert(
        {
          id: 1,
          hero_slides: heroSlides,
          video_reels: videoReels,
          spotlight_nordic: spotlightNordic,
          spotlight_wood: spotlightWood,
          commitment_stage_image: commitmentImage,
          commitment_stage_video_url: commitmentVideoUrl,
          commitment_stage_caption: commitmentCaption,
        },
        { onConflict: "id" }
      );

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Film className="w-6 h-6 text-[#e2ad21]" />
            <span>Quản lý Video &amp; Media Trang chủ</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Upload video MP4/WebM (tối đa 50MB) hoặc dán link video cho Hero đầu trang, 6 thẻ Video Showroom, 2 khối Spotlight và khối Cam kết xưởng.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              tab === t.id
                ? "bg-[#e2ad21] text-[#141619] border-[#e2ad21]"
                : "bg-[#12151b] text-zinc-300 border-zinc-800 hover:border-zinc-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {tab === "hero" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-300">
                Các slide toàn màn hình ở đầu trang chủ ({heroSlides.length} slide). Nếu điền Video URL, nền slide sẽ tự động phát video thay cho ảnh tĩnh.
              </p>
              <button
                type="button"
                onClick={addHeroSlide}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 hover:border-[#e2ad21] px-3.5 py-2 text-xs font-semibold text-zinc-100 shrink-0"
              >
                <Plus className="w-4 h-4 text-[#e2ad21]" />
                <span>Thêm Hero slide</span>
              </button>
            </div>

            {heroSlides.map((slide, idx) => (
              <div
                key={slide.id}
                className="rounded-2xl border border-zinc-800 bg-[#12151b] p-5 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#e2ad21]">
                    Hero Slide #{idx + 1}
                  </span>
                  {heroSlides.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setHeroSlides((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa slide</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                      Eyebrow
                    </label>
                    <input
                      type="text"
                      value={slide.eyebrow}
                      onChange={(e) =>
                        updateHeroSlide(idx, { eyebrow: e.target.value })
                      }
                      className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                      Tiêu đề lớn (H1)
                    </label>
                    <input
                      type="text"
                      value={slide.title}
                      onChange={(e) =>
                        updateHeroSlide(idx, { title: e.target.value })
                      }
                      className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                      Nhãn nút CTA
                    </label>
                    <input
                      type="text"
                      value={slide.ctaLabel}
                      onChange={(e) =>
                        updateHeroSlide(idx, { ctaLabel: e.target.value })
                      }
                      className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                      Link nút CTA
                    </label>
                    <input
                      type="text"
                      value={slide.ctaHref}
                      onChange={(e) =>
                        updateHeroSlide(idx, { ctaHref: e.target.value })
                      }
                      className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                      Mô tả ngắn
                    </label>
                    <textarea
                      rows={2}
                      value={slide.subtitle}
                      onChange={(e) =>
                        updateHeroSlide(idx, { subtitle: e.target.value })
                      }
                      className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>

                <VideoUploader
                  label="Video nền Hero (.mp4)"
                  value={slide.videoUrl ?? ""}
                  poster={slide.image}
                  folder="hero"
                  onChange={(videoUrl) => updateHeroSlide(idx, { videoUrl })}
                />

                <ImageUploader
                  label="Ảnh Poster / Dự phòng"
                  value={slide.image}
                  folder="hero"
                  onChange={(image) => updateHeroSlide(idx, { image })}
                />
              </div>
            ))}
          </div>
        )}

        {tab === "reels" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-300">
                Dải thẻ Video từ Showroom ({videoReels.length} video). Tự phát loop trên thẻ và mở trình phát lớn khi bấm vào.
              </p>
              <button
                type="button"
                onClick={addReel}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 hover:border-[#e2ad21] px-3.5 py-2 text-xs font-semibold text-zinc-100 shrink-0"
              >
                <Plus className="w-4 h-4 text-[#e2ad21]" />
                <span>Thêm Reel mới</span>
              </button>
            </div>

            {videoReels.map((reel, idx) => (
              <div
                key={reel.id}
                className="rounded-2xl border border-zinc-800 bg-[#12151b] p-5 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#e2ad21]">
                    Video Reel #{idx + 1}
                  </span>
                  {videoReels.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setVideoReels((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa Reel</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                      Tiêu đề video
                    </label>
                    <input
                      type="text"
                      value={reel.title}
                      onChange={(e) =>
                        updateReel(idx, { title: e.target.value })
                      }
                      className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                      Nhãn chủ đề
                    </label>
                    <input
                      type="text"
                      value={reel.categoryLabel}
                      onChange={(e) =>
                        updateReel(idx, { categoryLabel: e.target.value })
                      }
                      className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                        Thời lượng
                      </label>
                      <input
                        type="text"
                        value={reel.duration}
                        onChange={(e) =>
                          updateReel(idx, { duration: e.target.value })
                        }
                        className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                        Lượt xem
                      </label>
                      <input
                        type="text"
                        value={reel.views}
                        onChange={(e) =>
                          updateReel(idx, { views: e.target.value })
                        }
                        className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                      Link sản phẩm / danh mục liên quan
                    </label>
                    <input
                      type="text"
                      value={reel.linkedHref}
                      onChange={(e) =>
                        updateReel(idx, { linkedHref: e.target.value })
                      }
                      className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                      Link Video TikTok (@noithathiendai10)
                    </label>
                    <input
                      type="url"
                      value={reel.tiktokUrl ?? ""}
                      onChange={(e) => {
                        const url = e.target.value;
                        const vidMatch = url.match(/\/video\/(\d{15,22})/);
                        updateReel(idx, {
                          tiktokUrl: url,
                          tiktokVideoId: vidMatch?.[1] ?? "",
                        });
                      }}
                      placeholder="https://www.tiktok.com/@noithathiendai10/video/..."
                      className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white placeholder:text-zinc-500"
                    />
                  </div>
                </div>

                <VideoUploader
                  label="File Video Reel (.mp4)"
                  value={reel.videoUrl ?? ""}
                  poster={reel.posterImage}
                  folder="reels"
                  onChange={(videoUrl) => updateReel(idx, { videoUrl })}
                />

                <ImageUploader
                  label="Ảnh Poster khi chưa phát"
                  value={reel.posterImage}
                  folder="reels"
                  onChange={(posterImage) => updateReel(idx, { posterImage })}
                />
              </div>
            ))}
          </div>
        )}

        {tab === "spotlights" && (
          <div className="space-y-6">
            {[
              {
                key: "nordic",
                heading: "Spotlight 1 — Dòng Sofa Bắc Âu (Bên cạnh)",
                data: spotlightNordic,
                setData: setSpotlightNordic,
              },
              {
                key: "wood",
                heading: "Spotlight 2 — Dòng Sofa Chân Gỗ (Toàn khung)",
                data: spotlightWood,
                setData: setSpotlightWood,
              },
            ].map((block) => (
              <div
                key={block.key}
                className="rounded-2xl border border-zinc-800 bg-[#12151b] p-5 space-y-4"
              >
                <h2 className="text-base font-bold text-[#e2ad21] border-b border-zinc-800 pb-3">
                  {block.heading}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                      Nhãn phụ
                    </label>
                    <input
                      type="text"
                      value={block.data.label}
                      onChange={(e) =>
                        block.setData({ ...block.data, label: e.target.value })
                      }
                      className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                      Tiêu đề lớn
                    </label>
                    <input
                      type="text"
                      value={block.data.title}
                      onChange={(e) =>
                        block.setData({ ...block.data, title: e.target.value })
                      }
                      className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                      Nút CTA
                    </label>
                    <input
                      type="text"
                      value={block.data.ctaLabel}
                      onChange={(e) =>
                        block.setData({
                          ...block.data,
                          ctaLabel: e.target.value,
                        })
                      }
                      className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                      Đường dẫn CTA
                    </label>
                    <input
                      type="text"
                      value={block.data.href}
                      onChange={(e) =>
                        block.setData({ ...block.data, href: e.target.value })
                      }
                      className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                      Mô tả
                    </label>
                    <textarea
                      rows={2}
                      value={block.data.description}
                      onChange={(e) =>
                        block.setData({
                          ...block.data,
                          description: e.target.value,
                        })
                      }
                      className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>

                <VideoUploader
                  label="Video nền khối Spotlight (.mp4)"
                  value={block.data.videoUrl ?? ""}
                  poster={block.data.posterImage || block.data.image}
                  folder="spotlights"
                  onChange={(videoUrl) =>
                    block.setData({ ...block.data, videoUrl })
                  }
                />

                <ImageUploader
                  label="Ảnh Poster dự phòng"
                  value={block.data.posterImage || block.data.image}
                  folder="spotlights"
                  onChange={(img) =>
                    block.setData({
                      ...block.data,
                      image: img,
                      posterImage: img,
                    })
                  }
                />
              </div>
            ))}
          </div>
        )}

        {tab === "commitment" && (
          <div className="rounded-2xl border border-zinc-800 bg-[#12151b] p-5 space-y-4">
            <h2 className="text-base font-bold text-[#e2ad21] border-b border-zinc-800 pb-3">
              Khối Cam kết chất lượng &amp; Quy trình Xưởng
            </h2>

            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1">
                Chữ nổi trên khung video
              </label>
              <input
                type="text"
                value={commitmentCaption}
                onChange={(e) => setCommitmentCaption(e.target.value)}
                className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white"
              />
            </div>

            <VideoUploader
              label="Video xưởng chế tác (.mp4)"
              value={commitmentVideoUrl}
              poster={commitmentImage}
              folder="commitment"
              onChange={setCommitmentVideoUrl}
            />

            <ImageUploader
              label="Ảnh Poster dự phòng"
              value={commitmentImage}
              folder="commitment"
              onChange={setCommitmentImage}
            />
          </div>
        )}

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-4 pt-2 border-t border-zinc-800">
          {savedOk && (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Đã lưu cấu hình Video và đồng bộ lên trang chủ!</span>
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#e2ad21] hover:bg-[#d19b16] px-6 py-2.5 text-sm font-bold text-[#141619] disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Đang lưu..." : "Lưu cấu hình Video trang chủ"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
