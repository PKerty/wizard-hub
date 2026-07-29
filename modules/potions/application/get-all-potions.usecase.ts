import type { PotionsRepository } from "../domain/potions-repository.port";

/** Application entry point for "list all potions" (ADR-0022). */
export function createGetAllPotionsUseCase(repo: PotionsRepository) {
  return async function getAllPotions() {
    return repo.findAll();
  };
}

export type GetAllPotionsUseCase = ReturnType<typeof createGetAllPotionsUseCase>;
