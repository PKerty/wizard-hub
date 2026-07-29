/**
 * Potion domain entity (ADR-0022). API-agnostic canonical shape.
 * The API calls the resource `/Elixirs`; the adapter is the only place that
 * knows about that name and performs the `ElixirResponse -> Potion` mapping.
 */
export interface Potion {
  id: string;
  name: string;
  effect: string | null;
  difficulty: string | null;
  ingredientIds: string[];
  ingredientNames: string[];
}
