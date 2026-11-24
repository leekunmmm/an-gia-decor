"use client";

import { useEffect } from "react";

export function CollectionParallax() {
  useEffect(() => {
    const desktopMq = window.matchMedia("(min-width: 1100px)");
    const reducedMq = window.matchMedia("(prefers-reduced-motion: reduce)");

    let rafId = 0;

    const resetTransforms = () => {
      const inners = document.querySelectorAll<HTMLElement>(
        ".v2-bst-media .v2-parallax-inner"
      );
      inners.forEach((el) => {
        el.style.transform = "";
      });
    };

    const update = () => {
      rafId = 0;
      if (!desktopMq.matches || reducedMq.matches) {
        resetTransforms();
        return;
      }

      const vh = window.innerHeight || 900;
      const medias = document.querySelectorAll<HTMLElement>(".v2-bst-media");

      medias.forEach((media) => {
        const inner = media.querySelector<HTMLElement>(".v2-parallax-inner");
        if (!inner) return;
        const rect = media.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > vh + 200) return;

        const centerOffset = (rect.top + rect.height / 2 - vh / 2) / vh;
        const shiftPct = Math.max(-4, Math.min(4, centerOffset * -5));
        inner.style.transform = `translate3d(0, ${shiftPct.toFixed(3)}%, 0)`;
      });
    };

    const schedule = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    desktopMq.addEventListener("change", schedule);
    reducedMq.addEventListener("change", schedule);

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      desktopMq.removeEventListener("change", schedule);
      reducedMq.removeEventListener("change", schedule);
    };
  }, []);

  return null;
}
