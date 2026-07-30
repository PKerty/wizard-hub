import { describe, expect, it } from "vitest";
import { buildDisplayName, buildElixirNames } from "@/modules/wizards/domain/wizard";

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

describe("buildElixirNames (detail panel — ADR-0028, display only, not indexed)", () => {
  it("returns an empty array for no elixirs (degenerate case)", () => {
    expect(buildElixirNames([])).toEqual([]);
  });

  it("maps elixir objects to their names", () => {
    expect(
      buildElixirNames([{ name: "Felix Felicis" }, { name: "Polyjuice Potion" }]),
    ).toEqual(["Felix Felicis", "Polyjuice Potion"]);
  });

  it("drops entries with null/empty/whitespace names", () => {
    expect(
      buildElixirNames([
        { name: "Felix Felicis" },
        { name: null },
        { name: "   " },
        { name: "Polyjuice Potion" },
      ]),
    ).toEqual(["Felix Felicis", "Polyjuice Potion"]);
  });
});
