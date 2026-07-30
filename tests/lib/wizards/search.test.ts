import { describe, expect, it } from "vitest";
import type { Wizard } from "@/modules/wizards/domain/wizard";
import {
  DEFAULT_FUZZY_THRESHOLD,
  createWizardIndex,
  searchWizards,
} from "@/lib/wizards/search";

function makeWizard(id: string, displayName: string | null): Wizard {
  return { id, displayName };
}

const SAMPLE: Wizard[] = [
  makeWizard("w1", "Fred Weasley"),
  makeWizard("w2", "Nicolas Flamel"),
  makeWizard("w3", null), // unnameable — must be excluded from the index
  makeWizard("w4", "Sacharissa Tugwood"),
];

describe("searchWizards (ADR-0028)", () => {
  it("returns [] for an empty query (degenerate case)", () => {
    const index = createWizardIndex(SAMPLE);
    expect(searchWizards(index, "")).toEqual([]);
  });

  it("returns [] for a whitespace-only query", () => {
    const index = createWizardIndex(SAMPLE);
    expect(searchWizards(index, "   ")).toEqual([]);
  });

  it("finds an exact match and assigns rank 0", () => {
    const index = createWizardIndex(SAMPLE);
    const result = searchWizards(index, "Nicolas Flamel");
    expect(result).toHaveLength(1);
    expect(result[0]?.wizard.id).toBe("w2");
    expect(result[0]?.rank).toBe(0);
  });

  it("finds a result despite a typo (fuzzy)", () => {
    const index = createWizardIndex(SAMPLE);
    const result = searchWizards(index, "Weysley"); // typo of Weasley
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((r) => r.wizard.id === "w1")).toBe(true);
  });

  it("never returns a wizard whose displayName is null (excluded from index)", () => {
    const index = createWizardIndex(SAMPLE);
    const result = searchWizards(index, "Flamel").concat(searchWizards(index, "Weasley"));
    expect(result.every((r) => r.wizard.displayName !== null)).toBe(true);
  });

  it("assigns incremental ranks across multiple results", () => {
    const index = createWizardIndex(SAMPLE);
    const result = searchWizards(index, "e"); // appears in several names
    expect(result.length).toBeGreaterThan(1);
    expect(result.map((r) => r.rank)).toEqual(result.map((_, i) => i));
  });

  it("exposes the default threshold constant for analytics", () => {
    expect(DEFAULT_FUZZY_THRESHOLD).toBe(0.3);
  });
});
