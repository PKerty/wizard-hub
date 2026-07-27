/**
 * Theme logic for wizard-hub (ADR-0013).
 *
 * Source of truth for valid themes, persistence, and initial resolution.
 * Kept framework-agnostic so it can be unit-tested without React.
 */

export const THEME_STORAGE_KEY = "wizard-hub:theme";
export const VALID_THEMES = ["dark", "light"] as const;
export type Theme = (typeof VALID_THEMES)[number];

export const DEFAULT_THEME: Theme = "dark";

/** Returns the opposite of the current theme. */
export function getNextTheme(current: Theme): Theme {
  return current === "dark" ? "light" : "dark";
}

/** Returns the persisted theme if (and only if) it is a valid value. */
export function readPersistedTheme(): Theme | null {
  const raw = localStorage.getItem(THEME_STORAGE_KEY);
  if (raw === null) return null;
  return VALID_THEMES.includes(raw as Theme) ? (raw as Theme) : null;
}

/**
 * Resolves the initial theme on first paint:
 * 1. Explicit user choice (localStorage) wins.
 * 2. Otherwise respect OS `prefers-color-scheme`.
 * 3. Otherwise fall back to default (dark — ADR-0013 spec).
 *
 * Runs in the browser only. Guarded for SSR safety where used.
 */
export function resolveInitialTheme(): Theme {
  const persisted = readPersistedTheme();
  if (persisted) return persisted;

  if (typeof window !== "undefined" && window.matchMedia) {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) return "dark";
  }

  return DEFAULT_THEME;
}

/** Persists the theme choice. No-op outside the browser. */
export function persistTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

/**
 * Inline script content for `<head>` that sets the initial `data-theme`
 * on `<html>` BEFORE React hydrates. Prevents flash of incorrect theme (FOUC).
 *
 * Intentionally a plain string — runs before module bundle, no imports allowed.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var k='${THEME_STORAGE_KEY}';var v=localStorage.getItem(k);var t=(v==='dark'||v==='light')?v:(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'dark');document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark';}})();`;
