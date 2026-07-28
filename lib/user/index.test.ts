import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  WIZARD_NAME_STORAGE_KEY,
  readWizardName,
  saveWizardName,
  clearWizardName,
  isUserKnown,
} from "./index";

describe("user lib", () => {
  describe("WIZARD_NAME_STORAGE_KEY", () => {
    it("matches a stable namespace (degenerate case)", () => {
      expect(WIZARD_NAME_STORAGE_KEY).toBe("wizard-hub:wizardName");
    });
  });

  describe("readWizardName", () => {
    afterEach(() => {
      localStorage.clear();
    });

    it("returns null when nothing is stored (degenerate case)", () => {
      expect(readWizardName()).toBeNull();
    });

    it("returns the stored name", () => {
      localStorage.setItem(WIZARD_NAME_STORAGE_KEY, "Hermione");
      expect(readWizardName()).toBe("Hermione");
    });
  });

  describe("saveWizardName", () => {
    afterEach(() => {
      localStorage.clear();
    });

    it("persists the name (trimmed, max 50 chars)", () => {
      saveWizardName("  Hermione  ");
      expect(localStorage.getItem(WIZARD_NAME_STORAGE_KEY)).toBe("Hermione");
    });

    it("truncates to 50 characters", () => {
      const long = "a".repeat(80);
      saveWizardName(long);
      expect(localStorage.getItem(WIZARD_NAME_STORAGE_KEY)).toHaveLength(50);
    });

    it("is a no-op outside the browser", () => {
      const spy = vi.spyOn(Storage.prototype, "setItem");
      const originalWindow = globalThis.window;
      // @ts-expect-error — deliberately undefined for the SSR test branch
      delete globalThis.window;
      try {
        saveWizardName("Hermione");
        expect(spy).not.toHaveBeenCalled();
      } finally {
        globalThis.window = originalWindow;
        spy.mockRestore();
      }
    });
  });

  describe("clearWizardName", () => {
    beforeEach(() => {
      localStorage.setItem(WIZARD_NAME_STORAGE_KEY, "Hermione");
    });

    afterEach(() => {
      localStorage.clear();
    });

    it("removes the stored name", () => {
      clearWizardName();
      expect(localStorage.getItem(WIZARD_NAME_STORAGE_KEY)).toBeNull();
    });
  });

  describe("isUserKnown", () => {
    afterEach(() => {
      localStorage.clear();
    });

    it("returns false when no name is stored (degenerate)", () => {
      expect(isUserKnown()).toBe(false);
    });

    it("returns true when a name is stored", () => {
      localStorage.setItem(WIZARD_NAME_STORAGE_KEY, "Hermione");
      expect(isUserKnown()).toBe(true);
    });
  });
});
