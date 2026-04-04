"use client";

import { useEffect, useState } from "react";

function readMatch(maxWidth: number) {
  if (typeof window === "undefined") {
    return false;
  }

  return window.innerWidth <= maxWidth;
}

export function useIsMobile(maxWidth = 960) {
  const [isMobile, setIsMobile] = useState(() => readMatch(maxWidth));

  useEffect(() => {
    const onResize = () => {
      setIsMobile(readMatch(maxWidth));
    };

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [maxWidth]);

  return isMobile;
}
