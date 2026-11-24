import React from "react";
import Link from "next/link";

export function DualArrowSvg() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <path
        className="v2-more-arrow is-out"
        fill="currentColor"
        d="M52,28 45.5,29.8 60,47 29.4,47 29.4,53 60,53 45.5,70.1 52,72 70.6,50"
      />
      <path
        className="v2-more-arrow is-in"
        fill="currentColor"
        d="M52,28 45.5,29.8 60,47 29.4,47 29.4,53 60,53 45.5,70.1 52,72 70.6,50"
      />
    </svg>
  );
}

interface MorePillProps {
  href: string;
  label: string;
  filled?: boolean;
  className?: string;
}

export function MorePill({ href, label, filled = false, className = "" }: MorePillProps) {
  return (
    <Link
      href={href}
      className={`v2-more ${filled ? "is-filled" : ""} ${className}`.trim()}
    >
      <span className="v2-more-label">{label}</span>
      <span className="v2-more-icon" aria-hidden="true">
        <DualArrowSvg />
      </span>
    </Link>
  );
}
