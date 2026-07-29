import { describe, expect, it } from "vitest";
import { createGetPlayablePotionsUseCase } from "./get-playable-potions.usecase";
import type { PotionsRepository } from "../domain/potions-repository.port";
import type { Potion } from "../domain/potion";

function makeStubRepo(overrides: Partial<PotionsRepository> = {}): PotionsRepository {
  return {
    findAll: async () => [],
    findPlayable: async () => [],
    findAllIngredients: async () => [],
    ...overrides,
  };
}

describe("getPlayablePotions use case", () => {
  it("returns an empty array when no potion is playable (degenerate case)", async () => {
    const getPlayablePotions = createGetPlayablePotionsUseCase(makeStubRepo());

    const result = await getPlayablePotions();

    expect(result).toEqual([]);
  });

  it("forwards the repository's playable subset unchanged", async () => {
    const playable: Potion[] = [
      {
        id: "p1",
        name: "Wiggenweld Potion",
        effect: "Awakens from sleep",
        difficulty: "Beginner",
        ingredientIds: ["i1", "i2", "i3"],
        ingredientNames: ["A", "B", "C"],
      },
    ];
    const getPlayablePotions = createGetPlayablePotionsUseCase(
      makeStubRepo({ findPlayable: async () => playable }),
    );

    const result = await getPlayablePotions();

    expect(result).toBe(playable);
    expect(result[0]?.ingredientIds).toHaveLength(3);
  });
});
