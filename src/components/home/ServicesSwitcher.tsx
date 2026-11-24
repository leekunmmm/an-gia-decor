"use client";

import React, { useEffect, useState } from "react";
import { ArrowDown, ArrowRight } from "lucide-react";
import { servicesData } from "@/data/homepage";

export function ServicesSwitcher() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % servicesData.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [paused]);

  const handleSelect = (idx: number) => {
    setPaused(true);
    setActiveIdx(idx);
  };

  return (
    <section
      className="v2-section is-ink v2-services"
      aria-label="Quy trình dịch vụ"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="v2-wrap">
        {/* Desktop Switcher */}
        <div className="v2-services-grid">
          <div className="v2-services-picture">
            {servicesData.map((srv, idx) => (
              <img
                key={srv.number}
                src={srv.image}
                alt={srv.title}
                className={idx === activeIdx ? "is-active" : ""}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none z-[1]" />
            <div className="absolute bottom-5 left-5 right-5 z-[2]">
              <span className="text-xs font-bold text-[#e2ad21] tracking-widest">
                {servicesData[activeIdx].number}
              </span>
              <p className="text-sm text-[#e5e5e5] mt-1 leading-relaxed">
                {servicesData[activeIdx].summary}
              </p>
            </div>
          </div>

          <div>
            <p className="v2-about-label" data-reveal="">
              QUY TRÌNH MAY ĐO &amp; HOÀN THIỆN
            </p>
            <p className="v2-about-body" data-reveal="">
              Dịch vụ chuẩn mực từ xưởng chế tác An Gia Decor đến không gian sống của gia đình bạn.
            </p>

            <ul className="v2-services-list">
              {servicesData.map((srv, idx) => {
                const pressed = idx === activeIdx;
                return (
                  <li key={srv.number}>
                    <button
                      type="button"
                      aria-pressed={pressed}
                      onMouseEnter={() => setActiveIdx(idx)}
                      onClick={() => handleSelect(idx)}
                      className="v2-services-btn"
                    >
                      <span className="v2-rooms-number">{srv.number}</span>
                      <span className="pr-3 leading-snug">{srv.title}</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Mobile Accordion (<= 767px) */}
        <div className="v2-services-m">
          <p className="v2-services-m-intro">
            Dịch vụ chuẩn mực từ xưởng chế tác An Gia Decor đến không gian sống của gia đình bạn.
          </p>

          {servicesData.map((srv, idx) => {
            const isOpen = idx === activeIdx;
            return (
              <div key={srv.number} className="v2-services-m-item">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => handleSelect(idx)}
                  className={`v2-services-m-head ${isOpen ? "is-open" : ""}`}
                >
                  <span className="v2-rooms-number">{srv.number}</span>
                  <span className="pr-3 leading-snug">{srv.title}</span>
                  <ArrowDown className="w-4 h-4 v2-services-m-arrow shrink-0" />
                </button>

                <div className="v2-m-collapse" data-open={isOpen ? "true" : "false"}>
                  <div>
                    <div className="v2-services-m-pic">
                      <img src={srv.image} alt={srv.title} />
                      <p className="v2-services-m-summary">{srv.summary}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
