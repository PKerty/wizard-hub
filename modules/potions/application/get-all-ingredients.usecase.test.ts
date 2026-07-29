import { describe, expect, it } from "vitest";
import { createGetAllIngredientsUseCase } from "./get-all-ingredients.usecase";
import type { PotionsRepository } from "../domain/potions-repository.port";
import type { Ingredient } from "../domain/ingredient";

function makeStubRepo(overrides: Partial<PotionsRepository> = {}): PotionsRepository {
  return {
    findAll: async () => [],
    findPlayable: async () => [],
    findAllIngredients: async () => [],
    ...overrides,
  };
}

describe("getAllIngredients use case", () => {
  it("returns an empty array when the repository has no ingredients (degenerate case)", async () => {
    const getAllIngredients = createGetAllIngredientsUseCase(makeStubRepo());

    const result = await getAllIngredients();

    expect(result).toEqual([]);
  });

  it("forwards the repository result unchanged", async () => {
    const ingredients: Ingredient[] = [
      { id: "i1", name: "Newt spleens" },
      { id: "i2", name: "Neem oil" },
    ];
    const getAllIngredients = createGetAllIngredientsUseCase(
      makeStubRepo({ findAllIngredients: async () => ingredients }),
    );

    const result = await getAllIngredients();

    expect(result).toBe(ingredients);
  });
});
