"use client";

import React, { useId, useState } from "react";
import { ImagePlus, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/svg+xml",
]);
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

async function uploadMediaFile(file: File, folder: string): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Chỉ hỗ trợ ảnh JPG, PNG, WebP, AVIF hoặc SVG.");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("Kích thước ảnh tối đa là 10MB.");
  }

  const supabase = createBrowserSupabaseClient();
  const cleanName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-");
  const safeFolder = folder.replace(/[^a-z0-9/_-]/gi, "") || "uploads";
  const path = `${safeFolder}/${Date.now()}-${cleanName}`;

  const { error: uploadError } = await supabase.storage
    .from("media")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    throw new Error(uploadError.message || "Tải ảnh lên thất bại.");
  }

  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

export function ImageUploader({
  label,
  value,
  onChange,
  folder = "general",
  placeholder = "/images/sofa-nordic.jpg hoặc https://...",
}: {
  label: string;
  value: string;
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
      const publicUrl = await uploadMediaFile(file, folder);
      onChange(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải ảnh lên.");
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
        <div className="w-20 h-20 rounded-lg border border-zinc-700/80 bg-zinc-900 overflow-hidden shrink-0 flex items-center justify-center">
          {value ? (
            <img
              src={value}
              alt={label}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImagePlus className="w-5 h-5 text-zinc-500" />
          )}
        </div>

        <div className="flex-1 w-full space-y-2">
          <div className="flex gap-2">
            <input
              id={inputId}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="flex-1 rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#e2ad21]"
            />
            <label className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 px-3 py-2 text-xs font-semibold text-zinc-100 cursor-pointer shrink-0 transition-colors">
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5 text-[#e2ad21]" />
              )}
              <span>{uploading ? "Đang tải..." : "Tải ảnh"}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
                onChange={handleFileChange}
                disabled={uploading}
                className="sr-only"
              />
            </label>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export function MultiImageUploader({
  label,
  values,
  onChange,
  folder = "gallery",
}: {
  label: string;
  values: string[];
  onChange: (nextUrls: string[]) => void;
  folder?: string;
}) {
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        uploaded.push(await uploadMediaFile(file, folder));
      }
      onChange([...values, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tải ảnh lên thất bại.");
    } finally {
      setUploading(false);
    }
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setUrlInput("");
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
          {label} ({values.length})
        </span>
        <label className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 px-3 py-1.5 text-xs font-semibold text-zinc-100 cursor-pointer transition-colors">
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5 text-[#e2ad21]" />
          )}
          <span>{uploading ? "Đang tải..." : "Upload nhiều ảnh"}</span>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
            onChange={handleFiles}
            disabled={uploading}
            className="sr-only"
          />
        </label>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Hoặc dán URL /images/... rồi nhấn Thêm"
          className="flex-1 rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#e2ad21]"
        />
        <button
          type="button"
          onClick={handleAddUrl}
          className="inline-flex items-center gap-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 px-3 py-2 text-xs font-semibold text-zinc-100"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm</span>
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {values.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {values.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              className="group relative rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900 aspect-[4/3]"
            >
              <img
                src={url}
                alt={`Ảnh ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => onChange(values.filter((_, i) => i !== idx))}
                aria-label="Xóa ảnh"
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/75 text-white hover:bg-red-600 flex items-center justify-center transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
