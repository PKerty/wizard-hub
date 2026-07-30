"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { CrystalOrb } from "./crystal-orb";

export const INTRO_STORAGE_KEY = "wizard-hub:intro-seen";

const HOLD_MS = 1800;
const FADE_MS = 500;

type Phase = "hidden" | "visible" | "leaving";

/**
 * Crystal Intro — a one-shot first-load splash on the home page.
 *
 * Route loaders flash too briefly to enjoy the orb, so the home page instead
 * gives the orb a deliberate moment: a full-viewport veil holds the swirling
 * orb centered, then fades to reveal the page. Shown **once per browser
 * session** (sessionStorage) so repeat navigations aren't blocked, and skipped
 * entirely under prefers-reduced-motion.
 *
 * The veil fade is Motion-driven (spring-eased, ADR-0030); the orb's own
 * materialisation is handled by `<CrystalOrb/>`. The phase/timer machine stays
 * (lint-clean, SSR-safe) and drives the Motion `animate` target.
 */
export function CrystalIntro() {
  const [phase, setPhase] = useState<Phase>("hidden");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (sessionStorage.getItem(INTRO_STORAGE_KEY)) return;

    // Defer the reveal to the next frame so the home page paints first and the
    // setState lives in a timer callback (not synchronously in the effect).
    const show = window.setTimeout(() => setPhase("visible"), 0);
    const leave = window.setTimeout(() => setPhase("leaving"), HOLD_MS);
    const done = window.setTimeout(() => {
      sessionStorage.setItem(INTRO_STORAGE_KEY, "1");
      setPhase("hidden");
    }, HOLD_MS + FADE_MS);

    return () => {
      window.clearTimeout(show);
      window.clearTimeout(leave);
      window.clearTimeout(done);
    };
  }, []);

  if (phase === "hidden") return null;

  return (
    <motion.div
      className="crystal-intro"
      initial={{ opacity: 0 }}
      animate={{ opacity: phase === "leaving" ? 0 : 1 }}
      transition={{ duration: FADE_MS / 1000, ease: [0.16, 1, 0.3, 1] }}
      aria-hidden="true"
    >
      <CrystalOrb />
    </motion.div>
  );
}

