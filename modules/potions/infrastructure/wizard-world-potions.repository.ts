import { wizardWorldFetch, WizardWorldApiError } from "@/lib/api/wizard-world.client";
import type {
  ElixirResponse,
  IngredientResponse,
} from "@/types/wizard-world";
import type { Potion } from "../domain/potion";
import type { Ingredient } from "../domain/ingredient";
import type { PotionsRepository } from "../domain/potions-repository.port";

/** ISR window for potions data (ADR-0005 / ADR-0022): 24h. */
const POTIONS_REVALIDATE_SECONDS = 86400;
const POTIONS_TAG = "potions";
/** Minimum recipe size to be playable (ADR-0024 §6): avoids trivial 1-round games. */
const MIN_PLAYABLE_INGREDIENTS = 2;

function mapElixirToPotion(r: ElixirResponse): Potion {
  return {
    id: r.id,
    name: r.name,
    effect: r.effect,
    difficulty: r.difficulty,
    ingredientIds: r.ingredients.map((i) => i.id),
    ingredientNames: r.ingredients.map((i) => i.name),
  };
}

function mapIngredient(i: IngredientResponse): Ingredient {
  return { id: i.id, name: i.name };
}

/**
 * Same defensive wrapper as the Houses adapter: ISR pages must render an empty
 * state instead of failing a deploy when the upstream API is asleep.
 */
async function safeFetch<T>(
  fetchFn: () => Promise<T>,
  fallback: T,
  context: string,
): Promise<T> {
  try {
    return await fetchFn();
  } catch (err) {
    if (err instanceof WizardWorldApiError) {
      console.warn(`[potions] API error during ${context}: ${err.status} ${err.message}`);
    } else {
      console.warn(`[potions] network error during ${context}:`, err);
    }
    return fallback;
  }
}

/** Concrete adapter implementing the PotionsRepository port (ADR-0022). */
export const wizardWorldPotionsRepository: PotionsRepository = {
  async findAll() {
    const raw = await safeFetch(
      () =>
        wizardWorldFetch<ElixirResponse[]>("/Elixirs", {
          revalidate: POTIONS_REVALIDATE_SECONDS,
          tags: [POTIONS_TAG],
        }),
      [] as ElixirResponse[],
      "findAll",
    );
    return raw.map(mapElixirToPotion);
  },

  async findPlayable() {
    const raw = await safeFetch(
      () =>
        wizardWorldFetch<ElixirResponse[]>("/Elixirs", {
          revalidate: POTIONS_REVALIDATE_SECONDS,
          tags: [POTIONS_TAG],
        }),
      [] as ElixirResponse[],
      "findPlayable",
    );
    return raw
      .filter((e) => e.ingredients.length >= MIN_PLAYABLE_INGREDIENTS)
      .map(mapElixirToPotion);
  },

  async findAllIngredients() {
    const raw = await safeFetch(
      () =>
        wizardWorldFetch<IngredientResponse[]>("/Ingredients", {
          revalidate: POTIONS_REVALIDATE_SECONDS,
          tags: [POTIONS_TAG],
        }),
      [] as IngredientResponse[],
      "findAllIngredients",
    );
    return raw.map(mapIngredient);
  },
};
