import type { HousesRepository } from "../domain/house-repository.port";

/**
 * Returns a single house by id, or null if not found.
 * Application layer: the single entry point for "house detail".
 */
export function createGetHouseByIdUseCase(repo: HousesRepository) {
  return async function getHouseById(id: string) {
    return repo.findById(id);
  };
}

export type GetHouseByIdUseCase = ReturnType<typeof createGetHouseByIdUseCase>;
