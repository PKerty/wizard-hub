"use client";

import { useEffect, useState } from "react";

const CAPTIONS = ["Consulting…", "Revealing…", "Summoning…"] as const;
const DEFAULT_INTERVAL_MS = 1800;

export interface CrystalOrbProps {
  /** Caption rotation cadence. Ignored under prefers-reduced-motion. */
  captionIntervalMs?: number;
}

/**
 * Crystal Orb loader — signature loading affordance (design-system §4.1).
 *
 * Nácar-radial surface with sigil glow + a drifting iridescent gradient; a mono
 * caption beneath cycles through "Consulting…/Revealing…/Summoning…". The orb
 * is a pure presentation node — the surface animation lives in globals.css
 * (`.crystal-orb`), this component only owns caption rotation.
 *
 * Reduced-motion: the global CSS rule freezes the surface drift; this component
 * additionally holds the caption on the first phrase so the whole element is
 * static (todo.md PR-5).
 */
export function CrystalOrb({ captionIntervalMs = DEFAULT_INTERVAL_MS }: CrystalOrbProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % CAPTIONS.length);
    }, captionIntervalMs);
    return () => window.clearInterval(id);
  }, [captionIntervalMs]);

  return (
    <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
      <div className="crystal-orb" aria-hidden="true" />
      <p className="font-mono text-mono-data text-moonlight">{CAPTIONS[index]}</p>
    </div>
  );
}
