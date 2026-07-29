import type { Ingredient, Potion } from "@/modules/potions";
import { shuffle } from "@/lib/potions/random";
import type { GameState } from "@/lib/potions/types";

/**
 * Potions game state machine + session factory (ADR-0023 / ADR-0024).
 *
 * Pure logic: no Math.random inside the reducer and no Date.now() — randomness
 * lives in `createGameSession` (run once at START), and elapsed time is derived
 * by the component from `startedAt`. This keeps the reducer deterministic and
 * unit-testable.
 */

export interface GameRound {
  /** The ingredient the user must pick this round. */
  correctId: string;
  /** 3 shuffled cards: the correct ingredient + 2 distractors. */
  cards: Ingredient[];
}

export interface GameSession {
  potion: Potion;
  rounds: GameRound[];
}

export interface GameReducerState {
  status: GameState;
  session: GameSession | null;
  roundIndex: number;
  cauldronIds: string[];
  startedAt: number;
  /** 1-indexed round where the user failed (LOST UI), null otherwise. */
  lostRound: number | null;
  /** Position (0|1|2) of the wrong card clicked (analytics + LOST UI). */
  failedCardIndex: 0 | 1 | 2 | null;
}

export const initialState: GameReducerState = {
  status: "idle",
  session: null,
  roundIndex: 0,
  cauldronIds: [],
  startedAt: 0,
  lostRound: null,
  failedCardIndex: null,
};

export type GameAction =
  | { type: "START"; session: GameSession; startedAt: number }
  | { type: "GUESS"; ingredientId: string; cardIndex: 0 | 1 | 2 }
  | { type: "RESTART" };

function ingredientFromRecipe(potion: Potion, id: string): Ingredient {
  const idx = potion.ingredientIds.indexOf(id);
  return { id, name: potion.ingredientNames[idx] ?? id };
}

/**
 * Builds a fully-resolved game session for a potion (ADR-0024).
 * - Recipe order is shuffled (so re-playing the same potion differs).
 * - Each round: 1 correct card (name from the potion's own recipe) + 2
 *   distractors drawn from the global pool, excluding the whole recipe.
 * - Distractors may repeat across rounds (ADR-0024 §4).
 */
export function createGameSession(potion: Potion, allIngredients: Ingredient[]): GameSession {
  const orderedRecipeIds = shuffle(potion.ingredientIds);
  const distractorPool = allIngredients.filter((i) => !potion.ingredientIds.includes(i.id));

  const rounds = orderedRecipeIds.map((correctId) => {
    const correct = ingredientFromRecipe(potion, correctId);
    const distractors = shuffle(distractorPool).slice(0, 2);
    const cards = shuffle([correct, ...distractors]);
    return { correctId, cards };
  });

  return { potion, rounds };
}

export function gameReducer(state: GameReducerState, action: GameAction): GameReducerState {
  switch (action.type) {
    case "START":
      return {
        ...initialState,
        status: "playing",
        session: action.session,
        startedAt: action.startedAt,
      };

    case "GUESS": {
      if (state.status !== "playing" || !state.session) return state;
      const round = state.session.rounds[state.roundIndex];
      if (!round) return state;

      if (action.ingredientId === round.correctId) {
        const cauldronIds = [...state.cauldronIds, action.ingredientId];
        const isLastRound = state.roundIndex + 1 >= state.session.rounds.length;
        if (isLastRound) {
          return { ...state, cauldronIds, status: "won" };
        }
        return { ...state, cauldronIds, roundIndex: state.roundIndex + 1 };
      }

      return {
        ...state,
        status: "lost",
        lostRound: state.roundIndex + 1,
        failedCardIndex: action.cardIndex,
      };
    }

    case "RESTART":
      return initialState;

    default:
      return state;
  }
}
