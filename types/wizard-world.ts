/**
 * Raw types matching the Wizard World API responses (House resource).
 * Source: https://wizard-world-api.herokuapp.com/swagger/index.html
 *
 * These are infrastructure-layer types; the domain layer (modules/{ctx}/domain)
 * may project these into cleaner entities.
 *
 * Note: the API does NOT return `members` or `colors` arrays on the House
 * resource — only `heads` and `traits`. Members can be queried separately
 * via /Wizards?HouseId=… if needed in the future.
 */

export interface HouseTraitResponse {
  id: string;
  name: string;
}

export interface HouseHeadResponse {
  id: string;
  firstName: string;
  lastName: string;
}

export interface HouseResponse {
  id: string;
  name: string;
  houseColours: string;
  founder: string;
  animal: string;
  element: string;
  ghost: string;
  commonRoom: string;
  heads: HouseHeadResponse[];
  traits: HouseTraitResponse[];
}

/* ==================== Elixirs / Ingredients (ADR-0022) ==================== */
/* Raw shapes of the /Elixirs and /Ingredients resources. Infrastructure only;
   the adapter maps these into domain Potion/Ingredient entities. */

export interface ElixirIngredientResponse {
  id: string;
  name: string;
}

export interface ElixirResponse {
  id: string;
  name: string;
  effect: string | null;
  sideEffects: string | null;
  difficulty: string | null;
  ingredients: ElixirIngredientResponse[];
}

export interface IngredientResponse {
  id: string;
  name: string;
}

/* ==================== Wizards (ADR-0028 — search-v2-fuzzy) ==================== */
/* Raw shapes of the /Wizards resource. Infrastructure only; the adapter maps
   these into the domain Wizard entity. Both `firstName` and `lastName` are
   nullable — the API does not guarantee either is present (today 3/17 wizards
   have a null firstName). */

export interface WizardElixirResponse {
  id: string;
  name: string;
}

export interface WizardResponse {
  id: string;
  firstName: string | null;
  lastName: string | null;
  elixirs: WizardElixirResponse[];
}
