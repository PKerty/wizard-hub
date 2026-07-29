import type { Ingredient } from "./ingredient";
import type { Potion } from "./potion";

/**
 * Port for the Potions repository (ADR-0009 §"Pragmatismo", ADR-0022).
 * Use cases depend on this abstraction so they stay unit-testable without fetch.
 */
export interface PotionsRepository {
  findAll(): Promise<Potion[]>;
  /** Pociones con receta jugable (ADR-0024 §6: ingredients.length >= 2). */
  findPlayable(): Promise<Potion[]>;
  findAllIngredients(): Promise<Ingredient[]>;
}
