import { describe, expect, it } from "vitest";
import { shuffle, pickRandom } from "@/lib/potions/random";

describe("shuffle", () => {
  it("returns an empty array for an empty array (degenerate case)", () => {
    expect(shuffle([])).toEqual([]);
  });

  it("preserves length and is a permutation of the input (same multiset)", () => {
    const input = [1, 2, 3, 4, 5];

    const result = shuffle(input);

    expect(result).toHaveLength(input.length);
    expect([...result].sort()).toEqual([...input].sort());
  });

  it("returns a new array; does not mutate the input", () => {
    const input = [1, 2, 3];
    const snapshot = [...input];

    const result = shuffle(input);

    expect(input).toEqual(snapshot);
    expect(result).not.toBe(input);
  });

  it("returns the same single element for a one-element array", () => {
    expect(shuffle(["solo"])).toEqual(["solo"]);
  });

  it("can produce a different order than the input (non-identity over many runs)", () => {
    const input = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    let sawDifferent = false;
    for (let i = 0; i < 50 && !sawDifferent; i++) {
      if (shuffle(input).some((v, idx) => v !== input[idx])) sawDifferent = true;
    }
    expect(sawDifferent).toBe(true);
  });
});

describe("pickRandom", () => {
  it("returns the only element of a single-element array", () => {
    expect(pickRandom(["only"])).toBe("only");
  });

  it("always returns an element that belongs to the array", () => {
    const input = ["a", "b", "c", "d"];
    for (let i = 0; i < 50; i++) {
      expect(input).toContain(pickRandom(input));
    }
  });

  it("throws on an empty array (fail-fast contract)", () => {
    expect(() => pickRandom([])).toThrow(RangeError);
  });
});
