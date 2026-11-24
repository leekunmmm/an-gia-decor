"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInErr || !data.user) {
        setError(
          signInErr?.message || "Email hoặc mật khẩu quản trị chưa chính xác."
        );
        return;
      }

      const { data: adminRow, error: adminErr } = await supabase
        .from("admin_users")
        .select("user_id, role")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (adminErr || !adminRow) {
        await supabase.auth.signOut();
        setError("Tài khoản này chưa được cấp quyền quản trị viên.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Không thể kết nối máy chủ xác thực. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0d10] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#12151b] p-7 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <img
            src="/images/an-gia-decor-logo-full.png"
            alt="An Gia Decor"
            className="h-20 w-auto object-contain"
          />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#e2ad21]">
              Admin Portal
            </p>
            <h1 className="text-xl font-bold text-white mt-1">
              Đăng nhập quản trị An Gia Decor
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="admin-email"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-300"
            >
              Email quản trị
            </label>
            <input
              id="admin-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@angiadecor.vn"
              className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#e2ad21]"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="admin-password"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-300"
            >
              Mật khẩu
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPass ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3.5 py-2.5 pr-10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#e2ad21]"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
              >
                {showPass ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#e2ad21] hover:bg-[#d19b16] text-[#141619] font-bold text-sm py-2.5 transition-colors disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            <span>{loading ? "Đang xác thực..." : "Đăng nhập hệ thống"}</span>
          </button>
        </form>

        <div className="pt-2 border-t border-zinc-800/80 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-[#e2ad21] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại trang chủ showroom</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
