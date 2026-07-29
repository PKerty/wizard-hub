import { afterEach, describe, expect, it, vi } from "vitest";
import { HIGH_SCORE_STORAGE_KEY, readHighScore, saveHighScore } from "@/lib/potions/storage";

describe("potions high score storage", () => {
  describe("HIGH_SCORE_STORAGE_KEY", () => {
    it("matches the wizard-hub namespace (degenerate case)", () => {
      expect(HIGH_SCORE_STORAGE_KEY).toBe("wizard-hub:potions-highscore");
    });
  });

  describe("readHighScore", () => {
    afterEach(() => {
      localStorage.clear();
    });

    it("returns 0 when nothing is stored (degenerate case)", () => {
      expect(readHighScore()).toBe(0);
    });

    it("returns the stored number", () => {
      localStorage.setItem(HIGH_SCORE_STORAGE_KEY, "7");
      expect(readHighScore()).toBe(7);
    });

    it("returns 0 when the stored value is not a valid number", () => {
      localStorage.setItem(HIGH_SCORE_STORAGE_KEY, "not-a-number");
      expect(readHighScore()).toBe(0);
    });

    it("returns 0 outside the browser (SSR-safe)", () => {
      const originalWindow = globalThis.window;
      // @ts-expect-error — deliberately undefined for the SSR test branch
      delete globalThis.window;
      try {
        expect(readHighScore()).toBe(0);
      } finally {
        globalThis.window = originalWindow;
      }
    });
  });

  describe("saveHighScore", () => {
    afterEach(() => {
      localStorage.clear();
    });

    it("persists the score when it beats the current high score", () => {
      saveHighScore(5);
      expect(localStorage.getItem(HIGH_SCORE_STORAGE_KEY)).toBe("5");
    });

    it("does not overwrite when the score is not higher", () => {
      localStorage.setItem(HIGH_SCORE_STORAGE_KEY, "9");
      saveHighScore(3);
      expect(localStorage.getItem(HIGH_SCORE_STORAGE_KEY)).toBe("9");
    });

    it("does not overwrite when the score equals the current high score", () => {
      localStorage.setItem(HIGH_SCORE_STORAGE_KEY, "4");
      saveHighScore(4);
      expect(localStorage.getItem(HIGH_SCORE_STORAGE_KEY)).toBe("4");
    });

    it("is a no-op outside the browser (SSR-safe)", () => {
      const spy = vi.spyOn(Storage.prototype, "setItem");
      const originalWindow = globalThis.window;
      // @ts-expect-error — deliberately undefined for the SSR test branch
      delete globalThis.window;
      try {
        saveHighScore(10);
        expect(spy).not.toHaveBeenCalled();
      } finally {
        globalThis.window = originalWindow;
        spy.mockRestore();
      }
    });
  });
});
