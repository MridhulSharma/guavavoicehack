"use client";

import { useEffect, useState } from "react";

/**
 * True when the visitor asked the OS for less motion. Starts false so SSR and
 * hydration agree, then corrects on mount; every animation this gates is
 * decorative, so one frame of motion before it settles is harmless.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let media: MediaQueryList;
    try {
      media = window.matchMedia("(prefers-reduced-motion: reduce)");
    } catch {
      return;
    }

    setReduced(media.matches);
    const onChange = () => setReduced(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
