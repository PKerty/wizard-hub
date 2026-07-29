/**
 * Persistent high score for the Potions game (ADR-0023).
 * Anonymous (not tied to wizardName) — works for both known and anonymous users.
 * Browser-only; safe to call from SSR (no-op / returns 0).
 */

export const HIGH_SCORE_STORAGE_KEY = "wizard-hub:potions-highscore";

/** Returns the persisted best streak, or 0 if none / invalid / SSR. */
export function readHighScore(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(HIGH_SCORE_STORAGE_KEY) ?? "0") || 0;
}

/** Persists the score only if it beats the current high score. No-op on SSR. */
export function saveHighScore(score: number): void {
  if (typeof window === "undefined") return;
  const current = readHighScore();
  if (score > current) {
    localStorage.setItem(HIGH_SCORE_STORAGE_KEY, String(score));
  }
}
