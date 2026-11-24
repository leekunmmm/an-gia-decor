import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFoundPage() {
  return (
    <section className="min-h-[75vh] bg-[#141619] flex items-center justify-center pt-[136px] pb-20 px-4 text-center">
      <div className="max-w-lg space-y-5">
        <span className="v2-eyebrow">404 · KHÔNG TÌM THẤY TRANG</span>
        <h1 className="v2-title">Trang này không tồn tại</h1>
        <p className="text-sm text-[#cccccc] leading-relaxed">
          Đường dẫn bạn truy cập có thể đã được thay đổi hoặc sản phẩm đã ngừng trưng bày.
        </p>
        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <Link href="/" className="v2-pill">
            <span>Về trang chủ</span>
            <ArrowRight className="w-4 h-4 v2-arrow" />
          </Link>
          <Link href="/danh-muc/tat-ca" className="v2-pill">
            <span>Xem Catalogue</span>
            <ArrowRight className="w-4 h-4 v2-arrow" />
          </Link>
        </div>
      </div>
    </section>
  );
}
