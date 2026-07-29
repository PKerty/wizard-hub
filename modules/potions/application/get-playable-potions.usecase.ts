import type { PotionsRepository } from "../domain/potions-repository.port";

/** Application entry point for "playable potions" (recipe size >= 2, ADR-0024). */
export function createGetPlayablePotionsUseCase(repo: PotionsRepository) {
  return async function getPlayablePotions() {
    return repo.findPlayable();
  };
}

export type GetPlayablePotionsUseCase = ReturnType<typeof createGetPlayablePotionsUseCase>;
