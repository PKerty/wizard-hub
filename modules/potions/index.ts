/**
 * Composition root for the Potions module (ADR-0022).
 * Wires the concrete adapter to the use cases — single place to swap implementations.
 */
import { wizardWorldPotionsRepository } from "./infrastructure/wizard-world-potions.repository";
import { createGetAllPotionsUseCase } from "./application/get-all-potions.usecase";
import { createGetPlayablePotionsUseCase } from "./application/get-playable-potions.usecase";
import { createGetAllIngredientsUseCase } from "./application/get-all-ingredients.usecase";

export const getAllPotions = createGetAllPotionsUseCase(wizardWorldPotionsRepository);
export const getPlayablePotions = createGetPlayablePotionsUseCase(wizardWorldPotionsRepository);
export const getAllIngredients = createGetAllIngredientsUseCase(wizardWorldPotionsRepository);

export type { Potion } from "./domain/potion";
export type { Ingredient } from "./domain/ingredient";
