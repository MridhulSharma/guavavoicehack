"use client";

import { OrbBackdrop } from "@/app/components/OrbBackdrop";

/**
 * The three fixed layers behind the UI, in paint order:
 *   0  the WebGL orb (absent if WebGL is unavailable -- body keeps the gradient)
 *   1  a themed scrim that bounds how far the orb can shift the backdrop, so
 *      panel contrast holds no matter what the shader is doing
 *   2  the edge aura, brighter while a call is live
 * All of it is aria-hidden and pointer-events:none; content sits at z-index 10.
 */
export function Backdrop({ live }: { live: boolean }) {
  return (
    <>
      <OrbBackdrop live={live} />
      <div className="backdrop-scrim" aria-hidden="true" />
      <div className="edge-glow" data-live={live} aria-hidden="true" />
    </>
  );
}
