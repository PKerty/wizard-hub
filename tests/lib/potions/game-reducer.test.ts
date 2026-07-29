import { describe, expect, it } from "vitest";
import type { Ingredient, Potion } from "@/modules/potions";
import {
  createGameSession,
  gameReducer,
  initialState,
  type GameSession,
} from "@/lib/potions/game-reducer";

/* ---- fixtures ---- */

function makePotion(overrides: Partial<Potion> = {}): Potion {
  return {
    id: "p1",
    name: "Wiggenweld Potion",
    effect: "Awakens from sleep",
    difficulty: "Beginner",
    ingredientIds: ["r1", "r2", "r3"],
    ingredientNames: ["Recipe A", "Recipe B", "Recipe C"],
    ...overrides,
  };
}

const POOL: Ingredient[] = [
  { id: "r1", name: "Recipe A" },
  { id: "r2", name: "Recipe B" },
  { id: "r3", name: "Recipe C" },
  { id: "d1", name: "Distractor One" },
  { id: "d2", name: "Distractor Two" },
  { id: "d3", name: "Distractor Three" },
  { id: "d4", name: "Distractor Four" },
];

/** Deterministic 3-round session (no random): correct card always at index 0. */
function makeSession(potion = makePotion()): GameSession {
  return {
    potion,
    rounds: potion.ingredientIds.map((correctId, i) => ({
      correctId,
      cards: [
        { id: correctId, name: potion.ingredientNames[i] ?? correctId },
        { id: `d${i + 1}`, name: `Distractor ${i + 1}` },
        { id: `d${i + 9}`, name: `Distractor ${i + 9}` },
      ],
    })),
  };
}

/* ---- createGameSession (random-backed factory, invariant checks) ---- */

describe("createGameSession", () => {
  it("produces one round per recipe ingredient (degenerate: empty recipe -> no rounds)", () => {
    const empty = makePotion({ ingredientIds: [], ingredientNames: [] });

    const session = createGameSession(empty, POOL);

    expect(session.rounds).toEqual([]);
  });

  it("has one round per ingredient in a normal recipe", () => {
    const session = createGameSession(makePotion(), POOL);
    expect(session.rounds).toHaveLength(3);
  });

  it("each round has exactly 3 cards", () => {
    const session = createGameSession(makePotion(), POOL);
    for (const round of session.rounds) {
      expect(round.cards).toHaveLength(3);
    }
  });

  it("each round's correctId belongs to the potion recipe", () => {
    const potion = makePotion();
    const session = createGameSession(potion, POOL);
    for (const round of session.rounds) {
      expect(potion.ingredientIds).toContain(round.correctId);
    }
  });

  it("the correct card is among the round's cards", () => {
    const potion = makePotion();
    const session = createGameSession(potion, POOL);
    for (const round of session.rounds) {
      expect(round.cards.some((c) => c.id === round.correctId)).toBe(true);
    }
  });

  it("distractors are never part of the recipe", () => {
    const potion = makePotion();
    const session = createGameSession(potion, POOL);
    for (const round of session.rounds) {
      const distractors = round.cards.filter((c) => c.id !== round.correctId);
      for (const d of distractors) {
        expect(potion.ingredientIds).not.toContain(d.id);
      }
    }
  });
});

/* ---- gameReducer (deterministic) ---- */

describe("gameReducer", () => {
  describe("initialState", () => {
    it("starts idle with no session (degenerate case)", () => {
      expect(initialState).toMatchObject({ status: "idle", session: null, roundIndex: 0, cauldronIds: [] });
    });
  });

  describe("START", () => {
    it("moves to playing with the session and resets progress", () => {
      const session = makeSession();
      const state = gameReducer(initialState, { type: "START", session, startedAt: 1000 });
      expect(state).toMatchObject({
        status: "playing",
        session,
        roundIndex: 0,
        cauldronIds: [],
        startedAt: 1000,
        lostRound: null,
        failedCardIndex: null,
      });
    });
  });

  describe("GUESS correct", () => {
    it("advances to the next round and adds the ingredient to the cauldron", () => {
      const session = makeSession();
      const started = gameReducer(initialState, { type: "START", session, startedAt: 0 });
      const correctId = session.rounds[0]!.correctId;

      const state = gameReducer(started, { type: "GUESS", ingredientId: correctId, cardIndex: 2 });

      expect(state.status).toBe("playing");
      expect(state.roundIndex).toBe(1);
      expect(state.cauldronIds).toEqual([correctId]);
    });

    it("wins when the last round is solved correctly", () => {
      const session = makeSession();
      let state = gameReducer(initialState, { type: "START", session, startedAt: 0 });
      for (let i = 0; i < session.rounds.length; i++) {
        state = gameReducer(state, {
          type: "GUESS",
          ingredientId: session.rounds[i]!.correctId,
          cardIndex: 0,
        });
      }
      expect(state.status).toBe("won");
      expect(state.cauldronIds).toHaveLength(session.rounds.length);
    });
  });

  describe("GUESS wrong", () => {
    it("loses, recording the 1-indexed round and the failed card index", () => {
      const session = makeSession();
      const started = gameReducer(initialState, { type: "START", session, startedAt: 0 });

      const state = gameReducer(started, { type: "GUESS", ingredientId: "d1", cardIndex: 1 });

      expect(state.status).toBe("lost");
      expect(state.lostRound).toBe(1);
      expect(state.failedCardIndex).toBe(1);
      expect(state.cauldronIds).toEqual([]);
    });
  });

  describe("GUESS guard", () => {
    it("is a no-op when not playing (idle)", () => {
      const state = gameReducer(initialState, { type: "GUESS", ingredientId: "r1", cardIndex: 0 });
      expect(state).toBe(initialState);
    });

    it("is a no-op after winning", () => {
      const session = makeSession(makePotion({ ingredientIds: ["r1"], ingredientNames: ["Only"] }));
      let state = gameReducer(initialState, { type: "START", session, startedAt: 0 });
      state = gameReducer(state, { type: "GUESS", ingredientId: "r1", cardIndex: 0 });
      const won = state;
      const after = gameReducer(won, { type: "GUESS", ingredientId: "r1", cardIndex: 0 });
      expect(after).toBe(won);
    });
  });

  describe("RESTART", () => {
    it("returns to the initial state after a loss", () => {
      const session = makeSession();
      const started = gameReducer(initialState, { type: "START", session, startedAt: 0 });
      const lost = gameReducer(started, { type: "GUESS", ingredientId: "d1", cardIndex: 2 });

      const state = gameReducer(lost, { type: "RESTART" });

      expect(state).toEqual(initialState);
    });
  });
});
