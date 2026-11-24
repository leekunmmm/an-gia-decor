"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function TopProgressBar() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    setVisible(true);
    setProgress(35);
    const t1 = setTimeout(() => setProgress(78), 110);
    const t2 = setTimeout(() => setProgress(100), 260);
    const t3 = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 480);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div id="nprogress" aria-hidden="true">
      <div
        className="bar transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      >
        <div className="peg" />
      </div>
    </div>
  );
}
