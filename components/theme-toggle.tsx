"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getNextTheme,
  persistTheme,
  resolveInitialTheme,
  type Theme,
} from "@/lib/theme";
import { trackThemeToggled } from "@/lib/analytics";

/**
 * Theme toggle button (ADR-0013 §6 + ADR-0007 event `Theme Toggled`).
 *
 * Initial theme is already applied to <html data-theme="..."> by the inline
 * script in <head> (see layout.tsx). This component only syncs React state
 * with that attribute and toggles on click.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof document === "undefined") return "dark";
    return (document.documentElement.dataset.theme as Theme) ?? "dark";
  });

  // Keep state in sync if the attribute is changed elsewhere.
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const current = document.documentElement.dataset.theme as Theme | undefined;
      if (current && current !== theme) {
        setTheme(current);
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, [theme]);

  const handleToggle = useCallback(() => {
    const next = getNextTheme(resolveInitialTheme());
    document.documentElement.dataset.theme = next;
    persistTheme(next);
    setTheme(next);
    trackThemeToggled({ newTheme: next });
  }, []);

  const label = theme === "dark" ? "Switch to light" : "Switch to dark";

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={label}
      title={label}
      className="fixed right-4 top-4 z-50 inline-flex size-10 items-center justify-center rounded-soft border border-moonlight/30 bg-bg-mist/60 text-torchlight backdrop-blur transition-colors duration-base ease-arcane hover:border-torchlight hover:text-steel"
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
