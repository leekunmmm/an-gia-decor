"use client";

import React from "react";
import { ClipboardCheck, ShoppingBag, Sparkles } from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { AuthPanel } from "./AuthPanel";

export function AuthSplitView({
  mode,
}: {
  mode: "login" | "register" | "forgot";
}) {
  const settings = useSiteSettings();
  const isForgot = mode === "forgot";

  return (
    <section className="v2-auth" aria-labelledby="v2-auth-heading">
      <img
        src="/images/hero-leather.jpg"
        alt=""
        aria-hidden="true"
        className="v2-auth-photo"
      />
      <div className="v2-auth-scrim" aria-hidden="true" />

      <div className="v2-wrap">
        <div className="v2-auth-grid">
          <div className="v2-auth-copy">
            <p className="v2-eyebrow">
              TÀI KHOẢN {settings.name.toUpperCase()}
            </p>
            {isForgot ? (
              <>
                <h1 id="v2-auth-heading">
                  Quên <span>mật khẩu?</span>
                </h1>
                <p className="v2-auth-lead">
                  Nhập email đã đăng ký, chúng tôi sẽ gửi cho bạn liên kết để
                  đặt mật khẩu mới.
                </p>
              </>
            ) : (
              <>
                <h1 id="v2-auth-heading">
                  {mode === "register" ? (
                    <>
                      Gia nhập <span>không gian sống tinh tế</span>
                    </>
                  ) : (
                    <>
                      Chào mừng <span>bạn trở lại</span>
                    </>
                  )}
                </h1>
                <ul className="v2-auth-perks">
                  <li>
                    <span className="v2-auth-perk-icon" aria-hidden="true">
                      <ClipboardCheck className="w-[18px] h-[18px]" />
                    </span>
                    <span>Theo dõi đơn hàng và lịch giao, lắp đặt</span>
                  </li>
                  <li>
                    <span className="v2-auth-perk-icon" aria-hidden="true">
                      <ShoppingBag className="w-[18px] h-[18px]" />
                    </span>
                    <span>Giữ danh sách yêu thích trên mọi thiết bị</span>
                  </li>
                  <li>
                    <span className="v2-auth-perk-icon" aria-hidden="true">
                      <Sparkles className="w-[18px] h-[18px]" />
                    </span>
                    <span>Nhận tư vấn và ưu đãi dành cho thành viên</span>
                  </li>
                </ul>
              </>
            )}
          </div>

          <div className="v2-auth-card">
            <AuthPanel variant="page" initialMode={mode} />
          </div>
        </div>
      </div>
    </section>
  );
}
