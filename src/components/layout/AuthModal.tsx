"use client";

import React from "react";
import { X } from "lucide-react";
import { useUI } from "@/context/UIContext";
import { AuthPanel } from "@/components/auth/AuthPanel";

export function AuthModal() {
  const { authOpen, setAuthOpen } = useUI();

  if (!authOpen) return null;

  return (
    <div
      className="auth-overlay auth-dialog-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) setAuthOpen(false);
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Đăng nhập hoặc đăng ký"
    >
      <div className="auth-dialog">
        <button
          type="button"
          onClick={() => setAuthOpen(false)}
          aria-label="Đóng cửa sổ tài khoản"
          className="absolute top-4 right-4 w-8 h-8 rounded-full grid place-items-center text-[#555] hover:bg-black/5 hover:text-black"
        >
          <X className="w-4 h-4" />
        </button>

        <AuthPanel variant="modal" onSuccessClose={() => setAuthOpen(false)} />
      </div>
    </div>
  );
}
