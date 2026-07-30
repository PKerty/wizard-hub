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
import { IngredientCard, sparkleTargets, type CardTone } from "@/components/potions/ingredient-card";

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

type Phase = keyof typeof DOT_CLASS;

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

  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // The victory/defeat overlay renders as soon as the round settles, but its
  // entrance is delayed so the card reveal (correct glow / wrong shake) lands
  // first — both beats without a managed timer (ADR-0030).
  const outcomeDelay = reduce ? 0 : 0.55;

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
          const phase: Phase =
            status === "won"
              ? "done"
              : i < roundIndex
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

      {/* Cauldron — recipe feed below the cards, newest on top so the cards
          never shift as the list grows (ADR-0023). */}
      <div className="cauldron-surface mt-8">
        <p className="font-display text-eyebrow uppercase tracking-[0.2em] text-torchlight">
          In the cauldron
        </p>
        <ul className="mt-3 divide-y divide-moonlight/10 overflow-hidden rounded-soft border border-moonlight/10 bg-bg-fog/30">
          {cauldronIds.length === 0 ? (
            <li className="px-4 py-3 font-body text-small italic text-whisper">
              Empty — awaiting the first reagent.
            </li>
          ) : (
            cauldronIds
              .map((id, i) => ({ id, i }))
              .reverse()
              .map(({ id, i }) => (
                <motion.li
                  key={`${id}-${i}`}
                  layout
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 26 }}
                  className="flex items-center gap-3 px-4 py-2.5"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    className="shrink-0 text-success"
                    aria-hidden="true"
                  >
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="font-mono text-mono-data text-steel/80 line-through decoration-success/40">
                    {nameById.get(id) ?? id}
                  </span>
                </motion.li>
              ))
          )}
        </ul>
      </div>

      {/* Victory / defeat — a centered moment with the play-again CTA.
          Appears after the card reveal so both beats land (ADR-0030). */}
      <AnimatePresence>
        {reveal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-bg-void/80 px-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.3, delay: outcomeDelay } }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-md overflow-hidden rounded-card border border-moonlight/20 bg-bg-mist px-8 py-10 text-center"
              initial={reduce ? { opacity: 0 } : { scale: 0.85, y: 18, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1, transition: { type: "spring", stiffness: 220, damping: 20, delay: outcomeDelay + 0.05 } }}
              exit={{ scale: 0.92, opacity: 0 }}
            >
              <div className="relative mx-auto mb-5 h-16 w-16">
                {status === "won" ? (
                  <>
                    <motion.svg
                      viewBox="0 0 24 24"
                      width="64"
                      height="64"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      className="relative mx-auto text-success"
                      aria-hidden="true"
                      initial={reduce ? false : { scale: 0.5, rotate: -12 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
                    >
                      <path
                        d="M9 3h6M10 3v4l-3 5a4 4 0 0 0 8 0l-3-5V3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </motion.svg>
                    {!reduce && (
                      <>
                        <motion.span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 -m-3 rounded-full border-2 border-success"
                          initial={{ scale: 0.6, opacity: 0.8 }}
                          animate={{ scale: 1.8, opacity: 0 }}
                          transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
                        />
                        {sparkleTargets(12, 56).map((s, i) => (
                          <motion.span
                            key={i}
                            aria-hidden="true"
                            className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full"
                            style={{
                              marginLeft: -3,
                              marginTop: -3,
                              backgroundColor: i % 2 === 0 ? "var(--color-success)" : "var(--color-iri-cyan)",
                            }}
                            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                            animate={{ x: s.x, y: s.y, opacity: 0, scale: 0.2 }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 + i * 0.02 }}
                          />
                        ))}
                      </>
                    )}
                  </>
                ) : (
                  <motion.svg
                    viewBox="0 0 24 24"
                    width="64"
                    height="64"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    className="relative mx-auto text-error"
                    aria-hidden="true"
                    initial={reduce ? false : { scale: 0.8 }}
                    animate={reduce ? undefined : { scale: 1, x: [0, -5, 5, -4, 4, 0] }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  >
                    <path
                      d="M9 3h6M10 3v4l-3 5a4 4 0 0 0 8 0l-3-5V3M5 21h14"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.svg>
                )}
              </div>

              {status === "won" ? (
                <>
                  <p className="font-display text-h2 font-semibold text-success">Potion complete!</p>
                  <p className="mt-2 font-mono text-mono-data text-moonlight">
                    {cauldronIds.length} reagents brewed
                    {highScore > 0 && cauldronIds.length >= highScore ? " · new best streak" : ""}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-display text-h2 font-semibold text-error">The brew spoiled.</p>
                  {round && (
                    <p className="mt-2 font-body text-body text-moonlight">
                      The right reagent was{" "}
                      <span className="font-mono text-steel">{nameById.get(round.correctId) ?? round.correctId}</span>.
                    </p>
                  )}
                </>
              )}

              <button
                type="button"
                onClick={handleRestart}
                className="btn-primary mt-7 inline-flex items-center justify-center rounded-soft bg-torchlight px-8 py-3 font-display text-eyebrow uppercase tracking-[0.2em] text-bg-void transition-all duration-base ease-arcane hover:brightness-110"
              >
                Brew again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
