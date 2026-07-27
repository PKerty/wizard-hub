import type { HousesRepository } from "../domain/house-repository.port";

/**
 * Returns all Hogwarts houses.
 * Application layer: the single entry point for "list all houses".
 * Page components must call this, never the repository directly (ADR-0009).
 */
export function createGetAllHousesUseCase(repo: HousesRepository) {
  return async function getAllHouses() {
    return repo.findAll();
  };
}

export type GetAllHousesUseCase = ReturnType<typeof createGetAllHousesUseCase>;
