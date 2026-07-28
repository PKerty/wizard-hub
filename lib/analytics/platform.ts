/**
 * Platform detection — ADR-0019.
 *
 * Pure helper (`detectPlatform`) + memoized runtime wrapper (`computePlatform`).
 * Used by the analytics wrapper to attach `platform` to every `track()` call,
 * so the metric "All Houses Viewed by Platform (Event Totals)" can be built
 * without depending on user identity or init ordering (anonymous-safe).
 */

export type Platform = "web-desktop" | "web-mobile" | "web-tablet";

const MOBILE_UA = /iPhone|Mobi|Windows Phone/i;
const TABLET_UA = /iPad|Android(?!.*Mobile)|Silk|PlayBook|Kindle/i;

/**
 * Classify a device from its user agent and viewport width.
 *
 * Heuristics (UA wins over width — a phone in landscape is still a phone):
 *   1. UA explicitly mentions a tablet → `web-tablet`.
 *   2. UA explicitly mentions a phone/Mobile → `web-mobile`.
 *   3. Otherwise → `web-desktop` (including empty/unknown UA, e.g. SSR fallback).
 *
 * @param userAgent `navigator.userAgent`
 * @param _width     `window.innerWidth` — reserved for future refinement
 *                   (currently unused: UA-only classification is stable enough
 *                   for the challenge scope; see ADR-0019 §"Decisión").
 */
export function detectPlatform(userAgent: string, _width: number): Platform {
  if (TABLET_UA.test(userAgent)) return "web-tablet";
  if (MOBILE_UA.test(userAgent)) return "web-mobile";
  return "web-desktop";
}

let cached: Platform | null | undefined;

/**
 * Resolve the current platform once per page lifetime.
 * Returns `null` in SSR (no `navigator`) — callers must omit the property
 * instead of sending `platform: null` to Amplitude.
 */
export function computePlatform(): Platform | null {
  if (cached !== undefined) return cached;

  if (typeof navigator === "undefined" || navigator === null) {
    cached = null;
    return null;
  }

  const width = typeof window !== "undefined" ? window.innerWidth : 0;
  cached = detectPlatform(navigator.userAgent, width);
  return cached;
}

/** Test-only: reset the memo between cases. */
export function __resetPlatformCacheForTests(): void {
  cached = undefined;
}
