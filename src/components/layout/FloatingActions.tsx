"use client";

import React, { useEffect, useState } from "react";
import { ArrowUp, MessageCircleMore, X } from "lucide-react";
import { useUI } from "@/context/UIContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { ChannelAnchor, getChannelItems } from "./ChannelIcons";

export function FloatingActions() {
  const { lenisRef } = useUI();
  const settings = useSiteSettings();
  const [open, setOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);

  const channels = getChannelItems(["shopee", "zalo", "messenger", "hotline"], settings);

  useEffect(() => {
    const onScroll = () => {
      setShowTop((window.scrollY || 0) > 360);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const scrollToTop = () => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Lên đầu trang"
        className={`v2-pd-top v2-round is-up ${showTop ? "is-shown" : ""}`}
      >
        <ArrowUp width={16} height={16} strokeWidth={2.5} aria-hidden="true" />
      </button>

      <div className={`ny-contact-launcher ${open ? "is-open" : ""}`}>
        <div
          id="ny-contact-actions"
          className="ny-contact-actions"
          aria-hidden={!open}
        >
          {channels.map((ch) => (
            <ChannelAnchor
              key={ch.key}
              channel={ch}
              tabIndex={open ? 0 : -1}
              className={`ny-contact-action ${ch.actionClassName}`}
            >
              <span className="ny-contact-label">{ch.label}</span>
              <span className="ny-contact-icon" aria-hidden="true">
                {ch.renderIcon({ size: ch.key === "hotline" ? 20 : 24 })}
              </span>
            </ChannelAnchor>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="ny-contact-actions"
          aria-label={open ? "Đóng liên hệ nhanh" : "Mở liên hệ nhanh"}
          className="ny-contact-trigger"
        >
          {open ? (
            <X width={24} height={24} strokeWidth={2} aria-hidden="true" />
          ) : (
            <MessageCircleMore
              width={25}
              height={25}
              strokeWidth={2}
              aria-hidden="true"
            />
          )}
        </button>
      </div>
    </>
  );
}
