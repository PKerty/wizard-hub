/**
 * Game state machine (ADR-0023).
 * IDLE -> PLAYING -> (WON | LOST) -> back to IDLE on "Play again".
 */
export type GameState = "idle" | "playing" | "won" | "lost";
