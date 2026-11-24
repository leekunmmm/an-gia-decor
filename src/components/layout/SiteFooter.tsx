"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Send } from "lucide-react";
import { useUI } from "@/context/UIContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { BrandLogo } from "./BrandLogo";
import { ChannelAnchor, getChannelItems } from "./ChannelIcons";

interface FooterFormErrors {
  name?: string;
  email?: string;
  phone?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SiteFooter() {
  const { showToast } = useUI();
  const brandConfig = useSiteSettings();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
  });
  const [errors, setErrors] = useState<FooterFormErrors>({});
  const [submitFailure, setSubmitFailure] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const channels = getChannelItems(["messenger", "zalo", "shopee", "hotline"], brandConfig);

  const validate = (): FooterFormErrors => {
    const next: FooterFormErrors = {};
    if (!form.name.trim()) {
      next.name = "Vui lòng nhập họ tên";
    }
    if (!form.email.trim()) {
      next.email = "Vui lòng nhập email";
    } else if (!EMAIL_RE.test(form.email.trim())) {
      next.email = "Email chưa đúng định dạng";
    }
    const phoneDigits = form.phone.replace(/\D/g, "");
    if (!form.phone.trim()) {
      next.phone = "Vui lòng nhập số điện thoại";
    } else if (phoneDigits.length < 9 || phoneDigits.length > 12) {
      next.phone = "Số điện thoại chưa hợp lệ";
    }
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSubmitFailure("Vui lòng kiểm tra lại các thông tin bắt buộc được đánh dấu.");
      return;
    }

    setErrors({});
    setSubmitFailure(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          company: form.company,
          message: form.message,
          source: "footer",
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        setSubmitFailure(
          payload.error || "Không thể gửi yêu cầu lúc này. Vui lòng thử lại sau."
        );
        return;
      }

      setSubmitted(true);
      showToast("Đã tiếp nhận yêu cầu tư vấn — An Gia Decor sẽ liên hệ sớm!");
    } catch {
      setSubmitFailure("Mất kết nối máy chủ. Vui lòng thử lại sau.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer id="footer">
      {/* Upper Contact & Quote Request Section */}
      <div className="v2-footer-form">
        <div className="v2-wrap">
          <p className="v2-eyebrow block text-center mb-3">
            Tư vấn thiết kế &amp; báo giá
          </p>
          <h2 className="v2-footer-form-title">Liên hệ tư vấn</h2>

          {submitted ? (
            <div className="max-w-xl mx-auto rounded-2xl border border-[#e2ad21]/40 bg-[#141619]/70 p-8 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-[#e2ad21] mx-auto" />
              <h3 className="text-xl font-semibold text-white">
                Cảm ơn {form.name || "Quý khách"} đã gửi yêu cầu
              </h3>
              <p className="text-sm text-[#cccccc] leading-relaxed">
                Chuyên viên tư vấn của {brandConfig.name} sẽ liên hệ qua số{" "}
                <strong className="text-white">{form.phone || brandConfig.hotline}</strong>{" "}
                hoặc email{" "}
                <strong className="text-white">{form.email || brandConfig.email}</strong>{" "}
                để gửi báo giá và lịch hẹn showroom.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setErrors({});
                  setSubmitFailure(null);
                  setForm({ name: "", email: "", phone: "", company: "", message: "" });
                }}
                className="v2-pill"
              >
                Gửi yêu cầu khác
              </button>
            </div>
          ) : (
            <form noValidate onSubmit={handleSubmit} className="v2-contact-form">
              <div className="v2-cf-lines">
                <label className="v2-cf-field">
                  <input
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder=" "
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value });
                      if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
                    }}
                    aria-invalid={Boolean(errors.name)}
                  />
                  <span>
                    Họ tên<b> (*)</b>
                  </span>
                  {errors.name && <em className="v2-cf-error">{errors.name}</em>}
                </label>

                <label className="v2-cf-field">
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder=" "
                    value={form.email}
                    onChange={(e) => {
                      setForm({ ...form, email: e.target.value });
                      if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                    }}
                    aria-invalid={Boolean(errors.email)}
                  />
                  <span>
                    Email<b> (*)</b>
                  </span>
                  {errors.email && <em className="v2-cf-error">{errors.email}</em>}
                </label>

                <label className="v2-cf-field">
                  <input
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder=" "
                    value={form.phone}
                    onChange={(e) => {
                      setForm({ ...form, phone: e.target.value });
                      if (errors.phone) setErrors((p) => ({ ...p, phone: undefined }));
                    }}
                    aria-invalid={Boolean(errors.phone)}
                  />
                  <span>
                    Điện thoại<b> (*)</b>
                  </span>
                  {errors.phone && <em className="v2-cf-error">{errors.phone}</em>}
                </label>

                <label className="v2-cf-field">
                  <input
                    name="company"
                    type="text"
                    autoComplete="organization"
                    placeholder=" "
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    aria-invalid={false}
                  />
                  <span>Công ty</span>
                </label>
              </div>

              <label className="v2-cf-message">
                <span className="sr-only">Lời nhắn</span>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Hãy để lại lời nhắn cho chúng tôi."
                />
              </label>

              {submitFailure && (
                <p role="alert" className="v2-cf-failure">
                  {submitFailure}
                </p>
              )}

              <button type="submit" disabled={submitting} className="v2-cf-send disabled:opacity-60">
                <Send width={18} height={18} strokeWidth={2} aria-hidden="true" />
                <span>{submitting ? "Đang gửi..." : "Gửi yêu cầu"}</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Main Dark Footer */}
      <div className="v2-section is-ink v2-footer-main v2-footer">
        <div data-reveal="" className="v2-wrap v2-footer-grid">
          {/* Column 1: Brand, Showroom & Channel SVGs */}
          <div>
            <div className="v2-footer-logo flex items-center">
              <BrandLogo size="lg" />
            </div>
            <p className="v2-muted">{brandConfig.description}</p>
            <p className="v2-muted">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  brandConfig.address
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                {brandConfig.address}
              </a>
            </p>
            <p>
              <a href={`tel:${brandConfig.hotlineRaw}`} className="v2-footer-gold">
                {brandConfig.hotline}
              </a>{" "}
              ·{" "}
              <a
                href={`mailto:${brandConfig.email}`}
                className="hover:text-[#e2ad21] transition-colors"
              >
                {brandConfig.email}
              </a>
            </p>
            <p className="text-xs text-[#9c9c9c]">{brandConfig.hours}</p>

            <div className="v2-footer-social mt-4">
              {channels.map((ch) => (
                <ChannelAnchor
                  key={ch.key}
                  channel={ch}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 text-[#cccccc] hover:border-[#e2ad21] hover:text-[#e2ad21] transition-colors"
                >
                  {ch.renderIcon({ size: 16 })}
                  <span>{ch.key === "hotline" ? "Hotline" : ch.shortLabel}</span>
                </ChannelAnchor>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Navigation */}
          <nav aria-label="Khám phá">
            <p className="v2-footer-heading text-[#e2ad21] mb-4">Khám phá</p>
            <ul>
              <li>
                <Link href="/danh-muc/tat-ca">Sản phẩm</Link>
              </li>
              <li>
                <Link href="/#rooms">Phòng</Link>
              </li>
              <li>
                <Link href="/bo-suu-tap">Bộ sưu tập</Link>
              </li>
              <li>
                <Link href="/du-an">Dự án</Link>
              </li>
              <li>
                <Link href="/tin-tuc">Tin tức</Link>
              </li>
              <li>
                <Link href="/thu-vien">Thư viện</Link>
              </li>
            </ul>
          </nav>

          {/* Column 3: Grayscale Map */}
          <div>
            <p className="v2-footer-heading text-[#e2ad21] mb-4">Showroom</p>
            <div className="v2-footer-map">
              <iframe
                title={`Bản đồ showroom ${brandConfig.name}`}
                src={brandConfig.mapEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <p className="text-xs text-[#9c9c9c] mt-2">
              Có chỗ đậu ô tô miễn phí trước showroom tại KĐT Sala.
            </p>
          </div>
        </div>

        <div className="v2-wrap v2-footer-bottom">
          <span>
            © {brandConfig.copyrightYear} {brandConfig.name}
          </span>
          <div className="flex flex-wrap gap-5">
            <Link href="/thu-vien" className="hover:text-white">
              Chính sách bảo hành
            </Link>
            <Link href="/tin-tuc" className="hover:text-white">
              Vận chuyển &amp; Lắp đặt
            </Link>
            <a href={`mailto:${brandConfig.email}`} className="hover:text-white">
              {brandConfig.domain}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
