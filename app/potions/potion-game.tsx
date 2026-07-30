"use client";

import { useCallback, useEffect, useReducer, useRef, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Ingredient, Potion } from "@/modules/potions";
import {
  createGameSession,
  gameReducer,
  initialState,
} from "@/lib/potions/game-reducer";
import { pickRandom } from "@/lib/potions/random";
import { readHighScore, saveHighScore } from "@/lib/potions/storage";
import {
  trackPotionGameLost,
  trackPotionGameRestarted,
  trackPotionGameStarted,
  trackPotionGameWon,
  trackPotionRoundPlayed,
} from "@/lib/analytics";
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

// Round transition — cards stagger in (ADR-0030). The grid is keyed by roundIndex
// inside <AnimatePresence mode="wait">, so the old round exits before the new one
// enters; staggerChildren orchestrates the 3-card reveal.
const ROUND_VARIANTS = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  exit: { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
} as const;

const CARD_SLOT_VARIANTS = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 24 } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.16 } },
} as const;

const DOT_CLASS = {
  done: "bg-success",
  current: "bg-torchlight",
  failed: "bg-error",
  pending: "bg-moonlight/20",
} as const;

export function PotionGame({ potions, ingredients }: PotionGameProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const { status, session, roundIndex, cauldronIds } = state;

  const settledRef = useRef<"won" | "lost" | null>(null);

  const beginGame = useCallback(() => {
    const potion = pickRandom(potions);
    settledRef.current = null;
    dispatch({
      type: "START",
      session: createGameSession(potion, ingredients),
      startedAt: Date.now(),
    });
    trackPotionGameStarted({
      potionId: potion.id,
      potionName: potion.name,
      recipeSize: potion.ingredientIds.length,
    });
  }, [potions, ingredients]);

  const handleRestart = () => {
    if (session && (status === "won" || status === "lost")) {
      trackPotionGameRestarted({
        previousPotionId: session.potion.id,
        previousOutcome: status,
      });
    }
    beginGame();
  };

  useEffect(() => {
    if (!session) return;
    if (status !== "won" && status !== "lost") return;
    // StrictMode-safe: the dev double-effect would otherwise double-fire the
    // terminal event + saveHighScore. Guard per session outcome.
    if (settledRef.current === status) return;
    settledRef.current = status;

    if (status === "won") {
      saveHighScore(cauldronIds.length);
      trackPotionGameWon({
        potionId: session.potion.id,
        potionName: session.potion.name,
        roundsCompleted: cauldronIds.length,
        durationSec: Math.round((Date.now() - state.startedAt) / 1000),
      });
    } else {
      saveHighScore(cauldronIds.length);
      trackPotionGameLost({
        potionId: session.potion.id,
        potionName: session.potion.name,
        round: state.lostRound ?? roundIndex + 1,
        failedCardIndex: state.failedCardIndex ?? 0,
      });
    }
  }, [status, cauldronIds.length, session, state.startedAt, state.lostRound, state.failedCardIndex, roundIndex]);

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
          onClick={beginGame}
          className="btn-primary inline-flex items-center justify-center rounded-soft bg-torchlight px-8 py-3 font-display text-eyebrow uppercase tracking-[0.2em] text-bg-void transition-all duration-base ease-arcane hover:brightness-110"
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

      {/* Progress dots — ignite/fill when their phase changes (keyed remount). */}
      <div className="mt-6 flex items-center gap-2">
        {session.rounds.map((_, i) => {
          const phase =
            i < roundIndex
              ? "done"
              : i === roundIndex && status === "playing"
                ? "current"
                : i === roundIndex && status === "lost"
                  ? "failed"
                  : "pending";
          return (
            <motion.span
              key={`${phase}-${i}`}
              className={"h-2 w-8 rounded-pill " + DOT_CLASS[phase]}
              initial={{ scaleX: 0.4, opacity: 0.5 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              style={{ originX: 0 }}
            />
          );
        })}
        <span className="ml-3 font-mono text-mono-data text-moonlight">
          {status === "won" ? totalRounds : roundIndex + (status === "playing" ? 1 : 0)} / {totalRounds}
        </span>
      </div>

      {/* Cauldron */}
      <div className="cauldron-surface mt-6">
        <p className="font-display text-eyebrow uppercase tracking-[0.2em] text-torchlight">
          In the cauldron
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {cauldronIds.length === 0 ? (
            <span className="font-body text-small italic text-whisper">Empty — awaiting the first reagent.</span>
          ) : (
            cauldronIds.map((id, i) => (
              <motion.span
                key={`${id}-${i}`}
                layout
                initial={{ opacity: 0, y: -10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 22 }}
                className="rounded-pill border border-success/40 bg-success/10 px-3 py-1 font-mono text-mono-data text-steel"
              >
                {nameById.get(id) ?? id}
              </motion.span>
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

      {/* Cards — staggered reveal per round via AnimatePresence (ADR-0030). */}
      <AnimatePresence mode="wait">
        {round && (
          <motion.div
            key={roundIndex}
            className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3"
            variants={ROUND_VARIANTS}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            {round.cards.map((card, idx) => {
              const tone: CardTone = reveal
                ? card.id === round.correctId
                  ? "correct"
                  : status === "lost" && state.failedCardIndex === idx
                    ? "wrong"
                    : "muted"
                : "default";
              return (
                <motion.div key={card.id} variants={CARD_SLOT_VARIANTS}>
                  <IngredientCard
                    name={nameById.get(card.id) ?? card.name}
                    tone={tone}
                    disabled={reveal}
                    index={idx}
                    onSelect={() => {
                      trackPotionRoundPlayed({
                        potionId: session.potion.id,
                        round: roundIndex + 1,
                        cardIndex: idx as 0 | 1 | 2,
                        correct: card.id === round.correctId,
                      });
                      dispatch({ type: "GUESS", ingredientId: card.id, cardIndex: idx as 0 | 1 | 2 });
                    }}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play again */}
      {reveal && (
        <button
          type="button"
          onClick={handleRestart}
          className="btn-primary mt-8 inline-flex items-center justify-center rounded-soft bg-torchlight px-8 py-3 font-display text-eyebrow uppercase tracking-[0.2em] text-bg-void transition-all duration-base ease-arcane hover:brightness-110"
        >
          Brew again
        </button>
      )}
    </div>
  );
}
