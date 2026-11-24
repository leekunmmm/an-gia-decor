"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CatalogueBanner() {
  return (
    <section
      className="v2-section is-black v2-catalogue"
      aria-label="Catalogue sản phẩm"
    >
      <img
        src="/images/hero-classic.jpg"
        alt="Catalogue nội thất An Gia Decor"
        className="v2-catalogue-bg"
      />

      <div className="v2-wrap v2-catalogue-copy" data-reveal="">
        <h2 className="v2-catalogue-headline">
          Hàng trăm mẫu nội thất may đo tinh tuyển cho căn hộ, nhà phố và biệt thự
        </h2>
        <p className="v2-catalogue-sub">
          Từ sofa da chống trầy, gỗ óc chó Bắc Mỹ đến bàn ăn đá phiến — sẵn sàng trải nghiệm tại showroom An Gia Decor.
        </p>
        <Link href="/danh-muc/tat-ca" className="v2-pill">
          <span>Xem catalogue</span>
          <ArrowRight className="w-4 h-4 v2-arrow" />
        </Link>
      </div>
    </section>
  );
}
