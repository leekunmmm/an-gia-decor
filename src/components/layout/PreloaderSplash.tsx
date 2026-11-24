"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSiteSettings } from "@/context/SiteSettingsContext";

const STROKE_PATHS = [
  { d: "M 26 84 L 110 35", delay: "0.05", dur: "0.65" },
  {
    d: "M 34 97 L 110 53 L 170 88 L 170 152 L 110 187 L 50 152 L 50 98",
    delay: "0.18",
    dur: "1.15",
  },
  { d: "M 64 95 L 64 144 L 110 171", delay: "0.45", dur: "0.75" },
  { d: "M 110 66 L 110 187", delay: "0.58", dur: "0.65" },
  { d: "M 110 66 L 156 93 L 110 118 L 170 152", delay: "0.72", dur: "0.75" },
] as const;

export function PreloaderSplash() {
  const settings = useSiteSettings();
  const [mounted, setMounted] = useState(true);
  const [textVisible, setTextVisible] = useState(false);
  const [shining, setShining] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const skippingRef = useRef(false);
  const prevOverflowRef = useRef("");

  useEffect(() => {
    const root = document.documentElement;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let alreadyDone = false;
    try {
      alreadyDone = window.sessionStorage.getItem("ag_splash_done") === "1";
    } catch {
      alreadyDone = false;
    }

    if (prefersReduced || alreadyDone || root.getAttribute("data-splash") === "off") {
      root.setAttribute("data-splash", "off");
      const t = setTimeout(() => setMounted(false), 0);
      return () => clearTimeout(t);
    }

    prevOverflowRef.current = root.style.overflow;
    root.style.overflow = "hidden";

    const isSpinMode = root.getAttribute("data-splash-mode") === "spin";
    let raf1 = 0;
    let raf2 = 0;

    if (!isSpinMode && svgRef.current) {
      const paths = svgRef.current.querySelectorAll<SVGPathElement>(".ag-splash__stroke");
      paths.forEach((path) => {
        const len = path.getTotalLength();
        path.style.strokeDasharray = `${len}`;
        path.style.strokeDashoffset = `${len}`;
        path.style.setProperty("--ag-delay", `${path.dataset.delay || 0}s`);
        path.style.setProperty("--ag-dur", `${path.dataset.dur || 0.8}s`);
      });

      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          paths.forEach((path) => {
            path.classList.add("is-drawing");
            path.style.strokeDashoffset = "0";
          });
        });
      });
    }

    const textTimer = isSpinMode ? 0 : setTimeout(() => setTextVisible(true), 950);
    const sheenTimer = isSpinMode ? 0 : setTimeout(() => setShining(true), 1350);

    const leaveDelay = isSpinMode ? 350 : 2250;
    const hideDelay = isSpinMode ? 900 : 3200;

    const leaveTimer = setTimeout(() => {
      if (skippingRef.current) return;
      setLeaving(true);
      root.setAttribute("data-splash", "leaving");
      root.style.overflow = prevOverflowRef.current;
      try {
        window.sessionStorage.setItem("ag_splash_done", "1");
      } catch {
        // Ignore storage errors
      }
    }, leaveDelay);

    const hideTimer = setTimeout(() => {
      if (skippingRef.current) return;
      root.setAttribute("data-splash", "off");
      setMounted(false);
    }, hideDelay);

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      if (textTimer) clearTimeout(textTimer);
      if (sheenTimer) clearTimeout(sheenTimer);
      clearTimeout(leaveTimer);
      clearTimeout(hideTimer);
      root.style.overflow = prevOverflowRef.current;
    };
  }, []);

  if (!mounted) return null;

  const handleSkip = () => {
    if (skippingRef.current) return;
    skippingRef.current = true;
    const root = document.documentElement;
    setLeaving(true);
    root.setAttribute("data-splash", "leaving");
    root.style.overflow = prevOverflowRef.current;
    try {
      window.sessionStorage.setItem("ag_splash_done", "1");
    } catch {
      // Ignore storage errors
    }
    setTimeout(() => {
      root.setAttribute("data-splash", "off");
      setMounted(false);
    }, 350);
  };

  return (
    <div
      id="agSplash"
      className={`ny-splash ag-splash ${textVisible ? "is-text-visible" : ""} ${
        shining ? "is-shining" : ""
      } ${leaving ? "is-leaving" : ""}`}
      onClick={handleSkip}
      role="status"
      aria-label={`Đang tải ${settings.name}`}
    >
      <span className="ny-splash-spinner" aria-hidden="true" />
      <div className="ag-splash__wrap">
        <div className="ag-splash__logo-box">
          <svg
            ref={svgRef}
            className="ag-splash__svg ny-splash-svg"
            viewBox="0 0 220 220"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="agSilverMetal" x1="12%" y1="8%" x2="88%" y2="92%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="22%" stopColor="#b9bfc7" />
                <stop offset="48%" stopColor="#f2f5f8" />
                <stop offset="72%" stopColor="#7c828b" />
                <stop offset="100%" stopColor="#dcdfe4" />
              </linearGradient>
            </defs>

            {STROKE_PATHS.map((stroke, idx) => (
              <path
                key={idx}
                className="ag-splash__stroke"
                data-delay={stroke.delay}
                data-dur={stroke.dur}
                d={stroke.d}
              />
            ))}
          </svg>
          <div className="ag-splash__sheen" />
        </div>

        <p className="ag-splash__brand">AN GIA DECOR</p>
        <div className="ag-splash__line">
          <div className="ag-splash__line-fill" />
        </div>
      </div>
    </div>
  );
}
