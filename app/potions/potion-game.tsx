"use client";

import { useCallback, useEffect, useReducer, useSyncExternalStore } from "react";
import type { Ingredient, Potion } from "@/modules/potions";
import {
  createGameSession,
  gameReducer,
  initialState,
} from "@/lib/potions/game-reducer";
import { pickRandom } from "@/lib/potions/random";
import { readHighScore, saveHighScore } from "@/lib/potions/storage";
import { IngredientCard, type CardTone } from "@/components/potions/ingredient-card";

export interface PotionGameProps {
  potions: Potion[];
  ingredients: Ingredient[];
}

function buildNameById(potion: Potion | undefined, pool: Ingredient[]): Map<string, string> {
  const map = new Map<string, string>();
  pool.forEach((i) => map.set(i.id, i.name));
  potion?.ingredientIds.forEach((id, i) => map.set(id, potion.ingredientNames[i] ?? id));
  return map;
}

export function PotionGame({ potions, ingredients }: PotionGameProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const { status, session, roundIndex, cauldronIds } = state;

  const start = useCallback(() => {
    const potion = pickRandom(potions);
    dispatch({
      type: "START",
      session: createGameSession(potion, ingredients),
      startedAt: Date.now(),
    });
  }, [potions, ingredients]);

  useEffect(() => {
    if (status === "won" || status === "lost") {
      saveHighScore(cauldronIds.length);
    }
  }, [status, cauldronIds.length]);

  const highScore = useSyncExternalStore(
    (cb) => {
      window.addEventListener("storage", cb);
      return () => window.removeEventListener("storage", cb);
    },
    readHighScore,
    () => 0,
  );

  const nameById = buildNameById(session?.potion, ingredients);

  if (status === "idle") {
    return (
      <div className="mt-12">
        {highScore > 0 && (
          <p className="mb-6 font-mono text-mono-data text-moonlight">
            Your best streak · {highScore}
          </p>
        )}
        <button
          type="button"
          onClick={start}
          className="inline-flex items-center justify-center rounded-soft bg-torchlight px-8 py-3 font-display text-eyebrow uppercase tracking-[0.2em] text-bg-void transition-all duration-base ease-arcane hover:shadow-[0_0_24px_rgba(212,162,75,0.25)] hover:brightness-110"
        >
          Start brewing
        </button>
      </div>
    );
  }

  if (!session) return null;

  const round = session.rounds[roundIndex];
  const totalRounds = session.rounds.length;
  const reveal = status === "won" || status === "lost";

  return (
    <div className="mt-12">
      {/* Potion identity */}
      <div className="border-b border-moonlight/20 pb-6">
        <h2 className="font-display text-h2 font-semibold text-steel">{session.potion.name}</h2>
        {session.potion.effect && (
          <p className="mt-2 font-body text-body italic text-moonlight/80">{session.potion.effect}</p>
        )}
      </div>

      {/* Progress dots */}
      <div className="mt-6 flex items-center gap-2">
        {session.rounds.map((_, i) => (
          <span
            key={i}
            className={
              "h-2 w-8 rounded-pill transition-colors duration-base " +
              (i < roundIndex
                ? "bg-success"
                : i === roundIndex && status === "playing"
                  ? "bg-torchlight"
                  : i === roundIndex && status === "lost"
                    ? "bg-error"
                    : "bg-moonlight/20")
            }
          />
        ))}
        <span className="ml-3 font-mono text-mono-data text-moonlight">
          {status === "won" ? totalRounds : roundIndex + (status === "playing" ? 1 : 0)} / {totalRounds}
        </span>
      </div>

      {/* Cauldron */}
      <div className="mt-6">
        <p className="font-display text-eyebrow uppercase tracking-[0.2em] text-torchlight">
          In the cauldron
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {cauldronIds.length === 0 ? (
            <span className="font-body text-small italic text-whisper">Empty — awaiting the first reagent.</span>
          ) : (
            cauldronIds.map((id, i) => (
              <span
                key={`${id}-${i}`}
                className="rounded-pill border border-success/40 bg-success/10 px-3 py-1 font-mono text-mono-data text-steel"
              >
                {nameById.get(id) ?? id}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Outcome banner */}
      {status === "won" && (
        <p className="mt-8 font-display text-h3 font-semibold text-success">Potion complete!</p>
      )}
      {status === "lost" && round && (
        <p className="mt-8 font-display text-h3 font-semibold text-error">
          The brew spoiled. The right reagent was {nameById.get(round.correctId) ?? round.correctId}.
        </p>
      )}

      {/* Cards */}
      {round && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {round.cards.map((card, idx) => {
            const tone: CardTone = reveal
              ? card.id === round.correctId
                ? "correct"
                : status === "lost" && state.failedCardIndex === idx
                  ? "wrong"
                  : "muted"
              : "default";
            return (
              <IngredientCard
                key={card.id}
                name={nameById.get(card.id) ?? card.name}
                tone={tone}
                disabled={reveal}
                onSelect={() => dispatch({ type: "GUESS", ingredientId: card.id, cardIndex: idx as 0 | 1 | 2 })}
              />
            );
          })}
        </div>
      )}

      {/* Play again */}
      {reveal && (
        <button
          type="button"
          onClick={start}
          className="mt-8 inline-flex items-center justify-center rounded-soft border border-moonlight bg-bg-mist/40 px-8 py-3 font-display text-eyebrow uppercase tracking-[0.2em] text-steel transition-all duration-base ease-arcane hover:border-torchlight hover:text-torchlight"
        >
          Brew again
        </button>
      )}
    </div>
  );
}
