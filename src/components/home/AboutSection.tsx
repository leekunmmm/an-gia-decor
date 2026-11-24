"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { aboutData } from "@/data/homepage";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { SplitText } from "./SplitText";

export function AboutSection() {
  const brandConfig = useSiteSettings();
  return (
    <section className="v2-section is-black v2-about" aria-label="Giới thiệu thương hiệu">
      <div className="v2-wrap">
        <SplitText
          as="h2"
          mode="chars-fade"
          text={aboutData.heading}
          className="v2-about-heading"
        />

        <div className="v2-about-grid">
          <div className="v2-parallax">
            <div className="v2-parallax-inner">
              <p className="v2-about-label">{aboutData.eyebrow}</p>
              <SplitText
                as="p"
                mode="words-fade"
                text={aboutData.description}
                className="v2-about-body"
              />
              <div data-reveal="">
                <Link href={aboutData.ctaHref} className="v2-pill">
                  <span>{aboutData.ctaLabel}</span>
                  <ArrowRight className="w-4 h-4 v2-arrow" />
                </Link>
              </div>
            </div>
          </div>

          <div className="v2-parallax v2-about-stat" data-reveal="">
            <div className="v2-parallax-inner">
              <strong>{brandConfig.experienceStat}</strong>
              <p className="v2-muted">{brandConfig.experienceLabel}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
