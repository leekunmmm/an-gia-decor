"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const REVEAL_SELECTOR = ".v2-reveal, [data-reveal], .v2-split, .v2-hotspots, .v2-bst-card";

function revealElement(el: Element) {
  if (el.classList.contains("v2-reveal")) {
    el.classList.add("is-in");
  }
  if (
    el.hasAttribute("data-reveal") ||
    el.classList.contains("v2-split") ||
    el.classList.contains("v2-hotspots") ||
    el.classList.contains("v2-bst-card")
  ) {
    el.classList.add("is-shown");
  }
  if (el.classList.contains("v2-bst-card")) {
    el.classList.add("is-revealed");
  }
}

function findHorizontalScrollContainer(el: Element): HTMLElement | null {
  let cur = el.parentElement;
  while (cur && cur !== document.body && cur !== document.documentElement) {
    const ox = window.getComputedStyle(cur).overflowX;
    if (ox === "auto" || ox === "scroll") {
      return cur;
    }
    cur = cur.parentElement;
  }
  return null;
}

export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targets = () => Array.from(document.querySelectorAll(REVEAL_SELECTOR));

    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      targets().forEach(revealElement);
      return;
    }

    const revealed = new WeakSet<Element>();
    const observed = new WeakSet<Element>();
    const observedContainers = new WeakSet<Element>();

    const markRevealed = (el: Element) => {
      revealElement(el);
      revealed.add(el);
    };

    const revealInHorizontalContainer = (container: Element, vh: number): boolean => {
      const hRect = container.getBoundingClientRect();
      if (hRect.height <= 0 || !(hRect.top < vh * 0.96 && hRect.bottom > 0)) {
        return false;
      }
      let allRevealed = true;
      container.querySelectorAll(REVEAL_SELECTOR).forEach((child) => {
        if (revealed.has(child)) return;
        const cRect = child.getBoundingClientRect();
        if (cRect.top < vh * 0.96 && cRect.bottom > 0) {
          markRevealed(child);
          observer.unobserve(child);
        } else {
          allRevealed = false;
        }
      });
      return allRevealed;
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const vh = window.innerHeight || 900;
        for (const entry of entries) {
          if (entry.isIntersecting || entry.boundingClientRect.top < vh * 0.96) {
            markRevealed(entry.target);
            observer.unobserve(entry.target);
            const hContainer = findHorizontalScrollContainer(entry.target);
            if (hContainer) {
              revealInHorizontalContainer(hContainer, vh);
            }
          }
        }
      },
      {
        rootMargin: "0px 0px -6% 0px",
        threshold: [0.01, 0.12],
      }
    );

    const containerObserver = new IntersectionObserver(
      (entries) => {
        const vh = window.innerHeight || 900;
        for (const entry of entries) {
          if (
            entry.isIntersecting ||
            (entry.boundingClientRect.top < vh * 0.96 && entry.boundingClientRect.bottom > 0)
          ) {
            if (revealInHorizontalContainer(entry.target, vh)) {
              containerObserver.unobserve(entry.target);
            }
          }
        }
      },
      {
        rootMargin: "0px 0px -6% 0px",
        threshold: [0.01, 0.12],
      }
    );

    const scan = () => {
      const vh = window.innerHeight || 900;
      for (const el of targets()) {
        if (revealed.has(el)) continue;
        const rect = el.getBoundingClientRect();
        const hContainer = findHorizontalScrollContainer(el);
        const inVerticalBand = rect.top < vh * 0.96 && rect.bottom > 0;

        if (inVerticalBand) {
          if (!hContainer) {
            markRevealed(el);
            observed.add(el);
            observer.unobserve(el);
            continue;
          }
          const hRect = hContainer.getBoundingClientRect();
          if (hRect.height > 0 && hRect.top < vh * 0.96 && hRect.bottom > 0) {
            markRevealed(el);
            observed.add(el);
            observer.unobserve(el);
            continue;
          }
        }

        if (!observed.has(el)) {
          observed.add(el);
          observer.observe(el);
        }
        if (hContainer && !observedContainers.has(hContainer)) {
          observedContainers.add(hContainer);
          containerObserver.observe(hContainer);
        }
      }
    };

    const rafId = requestAnimationFrame(scan);
    let mutRafId = 0;
    const mutObserver = new MutationObserver(() => {
      if (mutRafId) cancelAnimationFrame(mutRafId);
      mutRafId = requestAnimationFrame(scan);
    });
    mutObserver.observe(document.body, { childList: true, subtree: true });

    let resizeRafId = 0;
    const onResize = () => {
      if (resizeRafId) cancelAnimationFrame(resizeRafId);
      resizeRafId = requestAnimationFrame(scan);
    };
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      if (mutRafId) cancelAnimationFrame(mutRafId);
      if (resizeRafId) cancelAnimationFrame(resizeRafId);
      observer.disconnect();
      containerObserver.disconnect();
      mutObserver.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [pathname]);

  return null;
}
