"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

const CAPTIONS = ["Consulting…", "Revealing…", "Summoning…"] as const;
const DEFAULT_INTERVAL_MS = 1800;

/** SSR-safe read of the reduced-motion preference (ADR-0030). */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export interface CrystalOrbProps {
  /** Caption rotation cadence. Ignored under prefers-reduced-motion. */
  captionIntervalMs?: number;
}

/**
 * Crystal Orb loader — signature loading affordance (design-system §4.1).
 *
 * A glass sphere holding swirling iridescent energy. The continuous swirl lives
 * in globals.css (`.crystal-orb`, ambient — ADR-0030 keeps CSS as default); the
 * one-shot **materialisation** is Motion-driven (spring scale + rise + fade) so
 * the orb feels summoned into view rather than snapping in. A mono caption
 * beneath cycles "Consulting…/Revealing…/Summoning…".
 *
 * Reduced-motion: the global CSS rule freezes the swirl; the entrance spring is
 * skipped and the caption holds on the first phrase, so the whole element is
 * static.
 */
export function CrystalOrb({ captionIntervalMs = DEFAULT_INTERVAL_MS }: CrystalOrbProps) {
  const reduce = prefersReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce) return;

    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % CAPTIONS.length);
    }, captionIntervalMs);
    return () => window.clearInterval(id);
  }, [captionIntervalMs, reduce]);

  return (
    <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
      <motion.div
        className="crystal-orb"
        aria-hidden="true"
        initial={reduce ? false : { scale: 0.82, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 190, damping: 17 }}
      />
      <p className="font-mono text-mono-data text-moonlight">{CAPTIONS[index]}</p>
    </div>
  );
}

