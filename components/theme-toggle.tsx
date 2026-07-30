"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  getNextTheme,
  persistTheme,
  type Theme,
} from "@/lib/theme";
import { trackThemeToggled } from "@/lib/analytics";

/**
 * Subscribe to `data-theme` changes on <html>. Re-renders the component when
 * the attribute changes (e.g., after toggle, or via devtools).
 *
 * Using useSyncExternalStore (React 18+) is the idiomatic way to read external
 * (non-React) state. Avoids setState-in-effect anti-pattern AND keeps SSR safe
 * via getServerSnapshot.
 */
function subscribe(callback: () => void): () => void {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function getThemeSnapshot(): Theme {
  return (document.documentElement.dataset.theme as Theme | undefined) ?? "dark";
}

function getThemeServerSnapshot(): Theme {
  // Always "dark" on the server, matching <html data-theme="dark"> in layout.
  return "dark";
}

/**
 * Theme toggle button (ADR-0013 §6 + ADR-0007 event `Theme Toggled`).
 */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, getThemeServerSnapshot);

  const handleToggle = useCallback(() => {
    const next = getNextTheme(theme);
    document.documentElement.dataset.theme = next;
    persistTheme(next);
    trackThemeToggled({ newTheme: next });
  }, [theme]);

  const label = theme === "dark" ? "Switch to light" : "Switch to dark";

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={label}
      title={label}
      className="inline-flex size-11 items-center justify-center rounded-soft border border-moonlight/30 bg-bg-mist/60 text-torchlight backdrop-blur transition-all duration-base ease-arcane hover:-translate-y-px hover:border-torchlight hover:text-steel"
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {theme === "dark" ? (
          // placeholder sun — to be replaced by custom SVG icon (ADR-0015)
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </>
        ) : (
          // placeholder moon
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        )}
      </svg>
    </button>
  );
}
