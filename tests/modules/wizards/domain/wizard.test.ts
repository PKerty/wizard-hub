import { describe, expect, it } from "vitest";
import { buildDisplayName } from "@/modules/wizards/domain/wizard";

describe("buildDisplayName (ADR-0028 §3 — both parts nullable)", () => {
  it("returns null when both names are null (degenerate case)", () => {
    expect(buildDisplayName(null, null)).toBeNull();
  });

  it("returns null when both names are empty/whitespace", () => {
    expect(buildDisplayName("   ", "")).toBeNull();
    expect(buildDisplayName(undefined, "  ")).toBeNull();
  });

  it("combines first and last when both are present", () => {
    expect(buildDisplayName("Fred", "Weasley")).toBe("Fred Weasley");
  });

  it("returns only the last name when first is null", () => {
    expect(buildDisplayName(null, "Weasley")).toBe("Weasley");
  });

  it("returns only the first name when last is null", () => {
    expect(buildDisplayName("Fred", null)).toBe("Fred");
  });

  it("trims surrounding whitespace", () => {
    expect(buildDisplayName("  Fred  ", " Weasley ")).toBe("Fred Weasley");
  });
});
