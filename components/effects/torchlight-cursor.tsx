"use client";

import { useEffect } from "react";

/**
 * Pointer torchlight — Excalibur "torch carried through mist" (ADR-0029 prototype).
 *
 * Writes the pointer viewport position to CSS vars `--torch-x` / `--torch-y` on
 * `:root` via a rAF-throttled `pointermove` listener. The actual glow is painted
 * by `body::after` in globals.css, so this component renders nothing and stays
 * a single effect node GPU-friendly.
 *
 * Guarded for `prefers-reduced-motion` (no tracking) and `pointer: coarse`
 * (the CSS hides the glow on touch). Default var fallback centers the glow
 * before any movement.
 */
export function TorchlightCursor() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const root = document.documentElement;
    let frame = 0;

    const onMove = (event: PointerEvent) => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        root.style.setProperty("--torch-x", `${event.clientX}px`);
        root.style.setProperty("--torch-y", `${event.clientY}px`);
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
