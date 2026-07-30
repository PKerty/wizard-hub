"use client";

import { useMemo } from "react";
import { motion } from "motion/react";

export type CardTone = "default" | "correct" | "wrong" | "muted";

export interface IngredientCardProps {
  name: string;
  onSelect: () => void;
  disabled?: boolean;
  tone?: CardTone;
  /** Slot index (0–2) used to phase-offset the idle breathing glow. */
  index?: number;
}

const TONE_CLASS: Record<CardTone, string> = {
  default: "border-moonlight/30 bg-bg-mist/40 hover:border-torchlight",
  correct: "border-success/70 bg-success/10",
  wrong: "border-error/70 bg-error/10",
  muted: "border-moonlight/15 bg-bg-fog/40",
};

const SPARKLE_COUNT = 8;
const SPARKLE_RADIUS = 46;

/** SSR-safe read of the reduced-motion preference (matches the orb/intro pattern). */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Deterministic sparkle target positions for the correct-guess burst, evenly
 * distributed around the circle. Pure so it stays stable across renders and is
 * unit-testable.
 */
export function sparkleTargets(
  count: number,
  radius = SPARKLE_RADIUS,
): Array<{ x: number; y: number }> {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  });
}

/**
 * Reagent card for the Potion game (ADR-0023). Motion-driven reveal:
 * - default: hover lift + glow, subtle idle breathing halo (CSS, phased by index).
 * - correct: spring scale-up + expanding success ring + sparkle burst.
 * - wrong: red fizzle shake + scale-down.
 * - muted: dim + slight scale-down (the non-chosen cards after reveal).
 *
 * Reduced-motion: Motion auto-suppresses transforms; the burst DOM is also
 * suppressed (no sparkle particles). (ADR-0030 — Motion scoped to the reveal.)
 */
export function IngredientCard({
  name,
  onSelect,
  disabled,
  tone = "default",
  index = 0,
}: IngredientCardProps) {
  const reduce = prefersReducedMotion();
  const isCorrect = tone === "correct";
  const isWrong = tone === "wrong";
  const sparkles = useMemo(
    () => (isCorrect && !reduce ? sparkleTargets(SPARKLE_COUNT) : []),
    [isCorrect, reduce],
  );

  const reveal =
    tone === "default"
      ? { scale: 1, opacity: 1, x: 0 }
      : isCorrect
        ? { scale: 1.06, opacity: 1, x: 0 }
        : isWrong
          ? { scale: 0.95, opacity: 1, x: [0, -6, 6, -4, 4, -2, 0] }
          : { scale: 0.97, opacity: 0.6, x: 0 };

  const interactive = !disabled && !reduce && tone === "default";

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      data-tone={tone}
      aria-disabled={disabled || undefined}
      className={
        "relative flex h-full w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-card border p-6 text-center outline-none " +
        TONE_CLASS[tone] +
        (tone === "default" ? " reagent-idle" : "")
      }
      style={tone === "default" ? { animationDelay: `${index * 0.5}s` } : undefined}
      animate={reduce ? undefined : reveal}
      whileHover={interactive ? { y: -4, scale: 1.02 } : undefined}
      whileTap={interactive ? { scale: 0.98 } : undefined}
      transition={
        isWrong
          ? { duration: 0.45, ease: "easeInOut" }
          : { type: "spring", stiffness: 320, damping: 22 }
      }
    >
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className={isCorrect ? "text-success" : isWrong ? "text-error" : "text-torchlight"}
        aria-hidden="true"
      >
        <path
          d="M9 3h6M10 3v4l-3 5a4 4 0 0 0 8 0l-3-5V3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="break-words px-1 font-display text-eyebrow uppercase tracking-[0.15em] text-steel">
        {name}
      </span>

      {isCorrect && !reduce && (
        <>
          <motion.span
            data-testid="burst-ring"
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-card border-2 border-success"
            initial={{ scale: 0.7, opacity: 0.85 }}
            animate={{ scale: 1.9, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
          {sparkles.map((s, i) => (
            <motion.span
              key={i}
              data-testid="sparkle"
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-success"
              style={{ marginLeft: -3, marginTop: -3 }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: s.x, y: s.y, opacity: 0, scale: 0.2 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.02 }}
            />
          ))}
        </>
      )}
    </motion.button>
  );
}

