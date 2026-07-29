import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  THEME_STORAGE_KEY,
  VALID_THEMES,
  getNextTheme,
  readPersistedTheme,
  resolveInitialTheme,
} from "@/lib/theme/index";

describe("theme lib", () => {
  describe("VALID_THEMES", () => {
    it("contains dark and light only (degenerate case)", () => {
      expect(VALID_THEMES).toEqual(["dark", "light"]);
    });
  });

  describe("getNextTheme", () => {
      it("returns 'light' when current is 'dark'", () => {
      expect(getNextTheme("dark")).toBe("light");
      });

      it("returns 'dark' when current is 'light'", () => {
      expect(getNextTheme("light")).toBe("dark");
      });
  });

  describe("resolveInitialTheme", () => {
    let matchMediaSpy: ReturnType<typeof vi.fn>;

      beforeEach(() => {
      matchMediaSpy = vi.fn();
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: matchMediaSpy,
      });
      });

      afterEach(() => {
      vi.restoreAllMocks();
      localStorage.clear();
      });

      it("returns persisted theme when localStorage has a valid value", () => {
      localStorage.setItem(THEME_STORAGE_KEY, "light");
      matchMediaSpy.mockReturnValue({ matches: false });

      expect(resolveInitialTheme()).toBe("light");
      });

      it("falls back to prefers-color-scheme when localStorage is empty", () => {
      matchMediaSpy.mockReturnValue({ matches: true }); // prefers dark

      expect(resolveInitialTheme()).toBe("dark");
      });

      it("falls back to 'dark' as default when no signal available", () => {
      matchMediaSpy.mockReturnValue({ matches: false });

      expect(resolveInitialTheme()).toBe("dark");
      });
  });

  describe("readPersistedTheme", () => {
      afterEach(() => {
      localStorage.clear();
      });

      it("returns null when nothing is persisted (degenerate case)", () => {
      expect(readPersistedTheme()).toBeNull();
      });

      it("returns the persisted theme when valid", () => {
      localStorage.setItem(THEME_STORAGE_KEY, "light");

      expect(readPersistedTheme()).toBe("light");
      });

      it("returns null when persisted value is invalid", () => {
      localStorage.setItem(THEME_STORAGE_KEY, "neon");

      expect(readPersistedTheme()).toBeNull();
      });
  });

  describe("THEME_STORAGE_KEY (constant)", () => {
      it("matches design-system.md §5 spec", () => {
      expect(THEME_STORAGE_KEY).toBe("wizard-hub:theme");
      });
  });
});
