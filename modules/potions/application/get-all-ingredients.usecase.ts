import type { PotionsRepository } from "../domain/potions-repository.port";

/** Application entry point for the global ingredient pool (distractors, ADR-0024). */
export function createGetAllIngredientsUseCase(repo: PotionsRepository) {
  return async function getAllIngredients() {
    return repo.findAllIngredients();
  };
}

export type GetAllIngredientsUseCase = ReturnType<typeof createGetAllIngredientsUseCase>;
