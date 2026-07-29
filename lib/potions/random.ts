/**
 * Client-side randomness helpers (ADR-0024).
 * Fisher-Yates shuffle (unbiased) and uniform random pick.
 * Must only run in event handlers / effects, never during the initial render
 * of a client component, to avoid hydration mismatch (ADR-0024 section 6).
 */

export function shuffle<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

export function pickRandom<T>(arr: readonly T[]): T {
  if (arr.length === 0) {
    throw new RangeError("pickRandom called with an empty array");
  }
  return arr[Math.floor(Math.random() * arr.length)] as T;
}
