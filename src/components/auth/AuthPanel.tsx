"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Heart, LogOut } from "lucide-react";
import { useUI } from "@/context/UIContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

interface AuthErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  form?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function GoogleGIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.3 0 6.08-1.09 8.11-2.96l-3.88-3.05c-1.08.72-2.45 1.16-4.23 1.16-3.25 0-6.01-2.19-7-5.14H.98v3.14C3.03 21.22 7.21 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5 14.01c-.25-.72-.39-1.49-.39-2.29s.14-1.57.39-2.29V6.29H.98A11.97 11.97 0 0 0 0 11.72c0 1.93.46 3.76 1.28 5.43l3.72-3.14Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.8 0 3.41.62 4.68 1.83l3.51-3.51C18.07 1.19 15.3 0 12 0 7.21 0 3.03 2.78.98 6.86l4.02 3.13c.99-2.95 3.75-5.24 7-5.24Z"
      />
    </svg>
  );
}

export function AuthPanel({
  variant,
  initialMode = "login",
  onSuccessClose,
}: {
  variant: "modal" | "page";
  initialMode?: "login" | "register" | "forgot";
  onSuccessClose?: () => void;
}) {
  const router = useRouter();
  const settings = useSiteSettings();
  const { authTab, setAuthTab, setAuthOpen, user, signOut, wishlist, showToast } =
    useUI();

  const mode: "login" | "register" | "forgot" =
    variant === "modal" ? authTab : initialMode;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<AuthErrors>({});
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const switchTab = (nextTab: "login" | "register") => {
    setErrors({});
    setStatusNotice(null);
    setShowPass(false);
    setShowConfirmPass(false);
    if (variant === "page") {
      router.push(nextTab === "login" ? "/login" : "/register");
      return;
    }
    setAuthTab(nextTab);
  };

  const handleGoogleSignIn = async () => {
    setErrors({});
    setStatusNotice(null);
    setSubmitting(true);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

      if (supabaseUrl && supabaseAnonKey) {
        const res = await fetch(`${supabaseUrl}/auth/v1/settings`, {
          headers: { apikey: supabaseAnonKey },
        });
        if (res.ok) {
          const authSettings = (await res.json()) as {
            external?: { google?: boolean };
          };
          if (!authSettings.external?.google) {
            setStatusNotice(
              "Đăng nhập Google đang được cập nhật cấu hình OAuth. Vui lòng đăng nhập hoặc đăng ký bằng Email bên dưới."
            );
            return;
          }
        }
      }

      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error || !data?.url) {
        setStatusNotice(
          "Đăng nhập Google đang được cập nhật cấu hình OAuth. Vui lòng đăng nhập hoặc đăng ký bằng Email bên dưới."
        );
      }
    } catch {
      setStatusNotice(
        "Không thể khởi tạo đăng nhập Google lúc này. Vui lòng sử dụng Email bên dưới."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const validate = (): AuthErrors => {
    const next: AuthErrors = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      next.email = "Vui lòng nhập địa chỉ email.";
    } else if (!EMAIL_RE.test(trimmedEmail)) {
      next.email = "Email chưa đúng định dạng (ví dụ: ten@domain.vn).";
    }

    if (mode === "forgot") {
      return next;
    }

    if (mode === "register") {
      if (!name.trim()) {
        next.name = "Vui lòng nhập họ và tên.";
      }
      const digits = phone.replace(/\D/g, "");
      if (phone.trim() && (digits.length < 9 || digits.length > 12)) {
        next.phone = "Số điện thoại cần từ 9–12 chữ số.";
      }
      if (!password) {
        next.password = "Vui lòng nhập mật khẩu.";
      } else if (
        password.length < 8 ||
        !/[A-Za-z]/.test(password) ||
        !/[0-9]/.test(password)
      ) {
        next.password = "Mật khẩu cần ít nhất 8 ký tự, gồm cả chữ và số.";
      }
      if (!confirmPassword) {
        next.confirmPassword = "Vui lòng nhập lại mật khẩu.";
      } else if (confirmPassword !== password) {
        next.confirmPassword = "Mật khẩu nhập lại chưa khớp.";
      }
    } else {
      if (!password) {
        next.password = "Vui lòng nhập mật khẩu.";
      } else if (password.length < 6) {
        next.password = "Mật khẩu cần ít nhất 6 ký tự.";
      }
    }

    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusNotice(null);
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const trimmedEmail = email.trim();

      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(
          trimmedEmail,
          {
            redirectTo: `${window.location.origin}/auth/callback?next=/login`,
          }
        );
        if (error) {
          setErrors({
            form: error.message || "Không thể gửi liên kết đặt lại mật khẩu.",
          });
          return;
        }
        setStatusNotice(
          `Đã gửi liên kết đặt lại mật khẩu tới ${trimmedEmail}. Vui lòng kiểm tra hộp thư (hoặc liên hệ hotline ${settings.hotline}).`
        );
        showToast("Đã gửi liên kết đặt lại mật khẩu");
        return;
      }

      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (error) {
          setErrors({
            form: "Email hoặc mật khẩu chưa chính xác. Vui lòng kiểm tra lại.",
          });
          return;
        }
        setPassword("");
        showToast("Đăng nhập thành công!");
        if (variant === "modal") {
          onSuccessClose?.();
        } else {
          router.push("/");
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              full_name: name.trim(),
              phone: phone.trim(),
            },
          },
        });
        if (error) {
          setErrors({
            form: error.message || "Không thể tạo tài khoản. Vui lòng thử lại.",
          });
          return;
        }
        setPassword("");
        setConfirmPassword("");
        if (!data.session) {
          setStatusNotice(
            `Đã tạo tài khoản cho ${trimmedEmail}. Vui lòng kiểm tra email để xác nhận trước khi đăng nhập.`
          );
          return;
        }
        showToast(`Chào mừng ${name.trim()} gia nhập ${settings.name}!`);
        if (variant === "modal") {
          onSuccessClose?.();
        } else {
          router.push("/");
        }
      }
    } catch {
      setErrors({
        form: "Không thể kết nối máy chủ xác thực. Vui lòng thử lại sau.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (user) {
    const isPage = variant === "page";
    return (
      <div className="auth-panel py-1 space-y-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#e2ad21]">
            Thành viên {settings.name}
          </p>
          <h3
            className={`text-xl font-bold mt-1 ${
              isPage ? "text-white" : "text-[#111]"
            }`}
          >
            {user.name}
          </h3>
          <p className={`text-sm ${isPage ? "text-[#a8a29e]" : "text-[#666]"}`}>
            {user.email}
          </p>
        </div>

        <Link
          href="/danh-muc/tat-ca"
          onClick={() => onSuccessClose?.()}
          className={`p-4 rounded-xl flex items-center justify-between transition-colors ${
            isPage
              ? "bg-white/5 border border-white/10 hover:border-[#e2ad21]/60"
              : "bg-[#f6f6f6] hover:bg-[#efefef]"
          }`}
        >
          <div
            className={`flex items-center gap-2.5 text-sm font-semibold ${
              isPage ? "text-white" : "text-[#111]"
            }`}
          >
            <Heart className="w-4 h-4 text-[#d8a321]" />
            <span>Sản phẩm đã lưu yêu thích</span>
          </div>
          <span
            className={`text-sm font-bold ${
              isPage ? "text-[#e2ad21]" : "text-[#111]"
            }`}
          >
            {wishlist.length}
          </span>
        </Link>

        <button
          type="button"
          onClick={() => void signOut()}
          className={`w-full h-[48px] rounded-[8px] border text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
            isPage
              ? "border-white/20 text-white hover:bg-white/10"
              : "border-[#d5d5d5] text-[#111] hover:bg-[#f6f6f6]"
          }`}
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất</span>
        </button>
      </div>
    );
  }

  const idPrefix = mode;

  return (
    <div className="auth-panel">
      {mode !== "forgot" && (
        <>
          <div className="auth-tabs" role="tablist" aria-label="Tài khoản">
            <button
              type="button"
              role="tab"
              id="auth-tab-login"
              aria-selected={mode === "login"}
              onClick={() => switchTab("login")}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              role="tab"
              id="auth-tab-register"
              aria-selected={mode === "register"}
              onClick={() => switchTab("register")}
            >
              Đăng ký
            </button>
          </div>

          <div className="auth-google">
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleGoogleSignIn()}
              className="auth-google-btn"
            >
              <GoogleGIcon />
              <span>Tiếp tục sử dụng dịch vụ bằng Google</span>
            </button>
          </div>

          <p className="auth-divider">
            <span>Hoặc</span>
          </p>
        </>
      )}

      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        {mode === "register" && (
          <div className={`auth-field ${errors.name ? "has-error" : ""}`}>
            <label htmlFor={`${idPrefix}-name`}>
              Họ và tên<span aria-hidden="true">*</span>
            </label>
            <div className="auth-input">
              <input
                id={`${idPrefix}-name`}
                name="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
                }}
                aria-invalid={Boolean(errors.name)}
              />
            </div>
            {errors.name && <p className="auth-error">{errors.name}</p>}
          </div>
        )}

        <div className={`auth-field ${errors.email ? "has-error" : ""}`}>
          <label htmlFor={`${idPrefix}-email`}>
            Email<span aria-hidden="true">*</span>
          </label>
          <div className="auth-input">
            <input
              id={`${idPrefix}-email`}
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
              }}
              aria-invalid={Boolean(errors.email)}
            />
          </div>
          {errors.email && <p className="auth-error">{errors.email}</p>}
        </div>

        {mode === "register" && (
          <div className={`auth-field ${errors.phone ? "has-error" : ""}`}>
            <label htmlFor={`${idPrefix}-phone`}>
              Số điện thoại <span>(không bắt buộc)</span>
            </label>
            <div className="auth-input">
              <input
                id={`${idPrefix}-phone`}
                name="phone"
                type="tel"
                inputMode="tel"
                maxLength={16}
                autoComplete="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) {
                    setErrors((p) => ({ ...p, phone: undefined }));
                  }
                }}
                aria-invalid={Boolean(errors.phone)}
              />
            </div>
            {errors.phone && <p className="auth-error">{errors.phone}</p>}
          </div>
        )}

        {mode !== "forgot" && (
          <div className={`auth-field ${errors.password ? "has-error" : ""}`}>
            <label htmlFor={`${idPrefix}-password`}>
              Mật khẩu<span aria-hidden="true">*</span>
            </label>
            <div className="auth-input">
              <input
                id={`${idPrefix}-password`}
                name="password"
                type={showPass ? "text" : "password"}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) {
                    setErrors((p) => ({ ...p, password: undefined }));
                  }
                }}
                aria-invalid={Boolean(errors.password)}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                aria-pressed={showPass}
              >
                {showPass ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password ? (
              <p className="auth-error">{errors.password}</p>
            ) : (
              mode === "register" && (
                <p className="auth-hint">Ít nhất 8 ký tự, gồm cả chữ và số.</p>
              )
            )}
          </div>
        )}

        {mode === "register" && (
          <div
            className={`auth-field ${errors.confirmPassword ? "has-error" : ""}`}
          >
            <label htmlFor={`${idPrefix}-confirm`}>
              Nhập lại mật khẩu<span aria-hidden="true">*</span>
            </label>
            <div className="auth-input">
              <input
                id={`${idPrefix}-confirm`}
                name="confirmPassword"
                type={showConfirmPass ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) {
                    setErrors((p) => ({ ...p, confirmPassword: undefined }));
                  }
                }}
                aria-invalid={Boolean(errors.confirmPassword)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass((v) => !v)}
                aria-label={showConfirmPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                aria-pressed={showConfirmPass}
              >
                {showConfirmPass ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="auth-error">{errors.confirmPassword}</p>
            )}
          </div>
        )}

        {mode === "login" && (
          <p className="auth-forgot">
            <Link
              href="/quen-mat-khau"
              onClick={() => setAuthOpen(false)}
            >
              Quên mật khẩu?
            </Link>
          </p>
        )}

        {errors.form && (
          <p role="alert" className="auth-error mb-3">
            {errors.form}
          </p>
        )}

        {statusNotice && (
          <p
            role="status"
            className={`mb-3 rounded-lg border px-3 py-2 text-xs leading-relaxed ${
              variant === "page"
                ? "bg-[#e2ad21]/10 border-[#e2ad21]/45 text-[#f6e6b8]"
                : "bg-[#f6f2e8] border-[#d8a321]/50 text-[#5d4309]"
            }`}
          >
            {statusNotice}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="auth-submit disabled:opacity-60"
        >
          {submitting
            ? "Đang xử lý..."
            : mode === "login"
            ? "Đăng nhập"
            : mode === "register"
            ? "Đăng ký"
            : "Gửi liên kết đặt lại mật khẩu"}
        </button>
      </form>

      <p className="auth-switch">
        {mode === "login" ? (
          <>
            Chưa có tài khoản?{" "}
            <button type="button" onClick={() => switchTab("register")}>
              Đăng ký
            </button>
          </>
        ) : mode === "register" ? (
          <>
            Đã có tài khoản?{" "}
            <button type="button" onClick={() => switchTab("login")}>
              Đăng nhập
            </button>
          </>
        ) : (
          <Link className="auth-switch-link" href="/login">
            ← Quay lại đăng nhập
          </Link>
        )}
      </p>
    </div>
  );
}
