import { wizardWorldFetchSafe } from "@/lib/api/wizard-world.client";
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
/** Minimum recipe size to be playable (ADR-0024 section 6): avoids trivial 1-round games. */
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
 * Concrete adapter implementing the PotionsRepository port (ADR-0022).
 * Fetching is resilient (ADR-0026 `wizardWorldFetchSafe`): an upstream outage
 * degrades to an empty state rather than failing the build.
 */
export const wizardWorldPotionsRepository: PotionsRepository = {
  async findAll() {
    const raw = await wizardWorldFetchSafe<ElixirResponse[]>("/Elixirs", {
      fallback: [],
      context: "potions/findAll",
      revalidate: POTIONS_REVALIDATE_SECONDS,
      tags: [POTIONS_TAG],
    });
    return raw.map(mapElixirToPotion);
  },

  async findPlayable() {
    const raw = await wizardWorldFetchSafe<ElixirResponse[]>("/Elixirs", {
      fallback: [],
      context: "potions/findPlayable",
      revalidate: POTIONS_REVALIDATE_SECONDS,
      tags: [POTIONS_TAG],
    });
    return raw
      .filter((e) => e.ingredients.length >= MIN_PLAYABLE_INGREDIENTS)
      .map(mapElixirToPotion);
  },

  async findAllIngredients() {
    const raw = await wizardWorldFetchSafe<IngredientResponse[]>("/Ingredients", {
      fallback: [],
      context: "potions/findAllIngredients",
      revalidate: POTIONS_REVALIDATE_SECONDS,
      tags: [POTIONS_TAG],
    });
    return raw.map(mapIngredient);
  },
};
