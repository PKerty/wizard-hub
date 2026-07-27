/**
 * Composition root for the Houses module.
 * Wires the concrete adapter to the use cases — single place to swap implementations
 * (e.g., for tests, replace `wizardWorldHousesRepository` with a mock).
 */
import { wizardWorldHousesRepository } from "./infrastructure/wizard-world-houses.repository";
import { createGetAllHousesUseCase } from "./application/get-all-houses.usecase";
import { createGetHouseByIdUseCase } from "./application/get-house-by-id.usecase";

export const getAllHouses = createGetAllHousesUseCase(wizardWorldHousesRepository);
export const getHouseById = createGetHouseByIdUseCase(wizardWorldHousesRepository);

export type { House } from "./domain/house";
