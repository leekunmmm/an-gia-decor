"use client";

import React from "react";
import Link from "next/link";
import { projects as defaultProjects, type ProjectItem } from "@/data/projects";
import { DualArrowSvg, MorePill } from "./MorePill";

export function HomeProjectsMarquee({
  projects = defaultProjects,
}: {
  projects?: ProjectItem[];
}) {
  const featuredList = (projects.filter((p) => p.featured).length > 0
    ? projects.filter((p) => p.featured)
    : projects
  ).slice(0, 6);

  if (featuredList.length === 0) return null;

  return (
    <section
      className="v2-section is-slate v2-hprj"
      aria-label="Dự án nội thất đã hoàn thiện"
    >
      <h2 className="v2-hprj-title v2-wrap" data-reveal="">
        Các dự án đã thực hiện
      </h2>

      {/* Infinite Dual-Set Horizontal Marquee */}
      <div className="v2-hprj-strip">
        <div className="v2-hprj-run" style={{ animationDuration: "99.5s" }}>
          {[0, 1].map((setIdx) => (
            <div
              key={setIdx}
              className="v2-hprj-set"
              aria-hidden={setIdx === 1 || undefined}
            >
              {featuredList.map((prj) => (
                <Link
                  key={`${setIdx}-${prj.slug}`}
                  href={`/du-an/loai/${prj.type}`}
                  tabIndex={setIdx === 1 ? -1 : undefined}
                  className="v2-hprj-tile block"
                >
                  <img src={prj.coverImage} alt={prj.title} />
                  <div className="v2-hprj-scrim" aria-hidden="true" />
                  <div className="v2-hprj-copy">
                    <h3 className="v2-hprj-name line-clamp-1">{prj.title}</h3>
                    <p className="v2-hprj-meta">
                      {prj.typeLabel} · {prj.location} · {prj.year}
                    </p>
                    <span className="v2-hprj-more">
                      <span>Xem thêm</span>
                      <span className="v2-bst-more-icon" aria-hidden="true">
                        <DualArrowSvg />
                      </span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="v2-hprj-all">
        <MorePill href="/du-an" label="Xem tất cả dự án" />
      </div>
    </section>
  );
}
