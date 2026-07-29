import { describe, expect, it } from "vitest";
import { createGetAllPotionsUseCase } from "@/modules/potions/application/get-all-potions.usecase";
import type { PotionsRepository } from "@/modules/potions/domain/potions-repository.port";
import type { Potion } from "@/modules/potions/domain/potion";

function makeStubRepo(overrides: Partial<PotionsRepository> = {}): PotionsRepository {
  return {
    findAll: async () => [],
    findPlayable: async () => [],
    findAllIngredients: async () => [],
    ...overrides,
  };
}

function makePotion(overrides: Partial<Potion> = {}): Potion {
  return {
    id: "p1",
    name: "Wiggenweld Potion",
    effect: null,
    difficulty: null,
    ingredientIds: ["i1", "i2"],
    ingredientNames: ["A", "B"],
    ...overrides,
  };
}

describe("getAllPotions use case", () => {
  it("returns an empty array when the repository has no potions (degenerate case)", async () => {
    const getAllPotions = createGetAllPotionsUseCase(makeStubRepo());

    const result = await getAllPotions();

    expect(result).toEqual([]);
  });

  it("forwards the repository result unchanged", async () => {
    const getAllPotions = createGetAllPotionsUseCase(
      makeStubRepo({ findAll: async () => [makePotion(), makePotion({ id: "p2" })] }),
    );

    const result = await getAllPotions();

    expect(result).toHaveLength(2);
    expect(result[1]?.id).toBe("p2");
  });
});
