"use client";

import React, { useId, useState } from "react";
import { Film, Loader2, Trash2, Upload } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

async function uploadVideoFile(file: File, folder: string): Promise<string> {
  if (!ALLOWED_VIDEO_TYPES.has(file.type)) {
    throw new Error("Chỉ hỗ trợ video MP4, WebM hoặc MOV.");
  }
  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error("Kích thước video tối đa là 50MB.");
  }

  const supabase = createBrowserSupabaseClient();
  const cleanName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-");
  const safeFolder = folder.replace(/[^a-z0-9/_-]/gi, "") || "videos";
  const path = `${safeFolder}/${Date.now()}-${cleanName}`;

  const { error: uploadError } = await supabase.storage
    .from("media")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    throw new Error(uploadError.message || "Tải video lên thất bại.");
  }

  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

export function VideoUploader({
  label,
  value,
  poster,
  onChange,
  folder = "videos",
  placeholder = "/videos/luxury-suite-pan.mp4 hoặc https://...",
}: {
  label: string;
  value: string;
  poster?: string;
  onChange: (nextUrl: string) => void;
  folder?: string;
  placeholder?: string;
}) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const publicUrl = await uploadVideoFile(file, folder);
      onChange(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải video lên.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="block text-xs font-semibold uppercase tracking-wider text-zinc-300"
      >
        {label}
      </label>

      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <div className="w-36 h-24 rounded-lg border border-zinc-700/80 bg-zinc-900 overflow-hidden shrink-0 flex items-center justify-center">
          {value ? (
            <video
              key={value}
              src={value}
              poster={poster || undefined}
              muted
              loop
              playsInline
              controls
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-zinc-500 px-2 text-center">
              <Film className="w-5 h-5" />
              <span className="text-[10px]">Đang dùng ảnh</span>
            </div>
          )}
        </div>

        <div className="flex-1 w-full space-y-2">
          <div className="flex flex-wrap gap-2">
            <input
              id={inputId}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="flex-1 min-w-[200px] rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#e2ad21]"
            />
            <label className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 px-3 py-2 text-xs font-semibold text-zinc-100 cursor-pointer shrink-0 transition-colors">
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5 text-[#e2ad21]" />
              )}
              <span>{uploading ? "Đang tải..." : "Tải video (.mp4)"}</span>
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleFileChange}
                disabled={uploading}
                className="sr-only"
              />
            </label>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                title="Xóa video, chỉ dùng ảnh tĩnh"
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 hover:border-red-500/50 hover:text-red-300 px-2.5 py-2 text-xs text-zinc-300"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Dùng ảnh</span>
              </button>
            )}
          </div>
          <p className="text-[11px] text-zinc-500">
            Hỗ trợ MP4 / WebM / MOV tối đa 50MB (tải trực tiếp lên Supabase) hoặc dùng đường dẫn /videos/...
          </p>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}
