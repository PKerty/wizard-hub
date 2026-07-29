# ADR-0023: Diseño del Potions game — reglas, scoring, fin

- **Estado:** Aceptado
- **Fecha:** 2026-07-28
- **Decisor(es):** kerty + arquitecto
- **Depende de:** [ADR-0022](./0022-modulo-potions-bounded-context.md) (módulo `potions`)
- **Habilita:** ADR-0024 (fetching + distractors), ADR-0025 (eventos v1.2)

## Contexto

La fase 2 del challenge pide un juego donde el usuario "prepara una poción" eligiendo el ingrediente correcto entre varias cards. Mecánica propuesta (kerty):

1. Sale una poción (con su receta).
2. aparecen **3 cards** con ingredientes, **1 correcta** + **2 distractors**.
3. elegís la correcta → se agrega al caldero → salen 3 cards nuevas para el siguiente ingrediente.
4. pifias → perdés.

Esto requiere formalizar:

- Cuándo y cómo se elige la poción jugable.
- Cuántos rounds dura una partida.
- Cómo se generan los distractors.
- Qué significa "ganar" y "perder".
- Cómo se puntúa.
- Si la puntuación sobrevive entre sesiones (retención).

Decisión explícita del user (2026-07-28): **score persistente (localStorage)** + **dificultad random pura en MVP** (sin progresión por `difficulty`).

## Decisión

### Máquina de estados del juego

```
            ┌──────────┐
            │   IDLE   │ ← estado inicial (start screen)
            └────┬─────┘
                 │ click "Start"
                 ▼
            ┌──────────┐  click correct card   ┌──────────┐
            │ PLAYING  │ ────────────────────► │ PLAYING  │ ... (next round)
            │ (round N)│                       │(round N+1)│
            └────┬─────┘                       └────┬─────┘
                 │ wrong card                       │ completed last ingredient
                 ▼                                  ▼
            ┌──────────┐                       ┌──────────┐
            │   LOST   │                       │   WON    │
            └────┬─────┘                       └────┬─────┘
                 │ click "Play again"               │ click "Play again"
                 └──────────────┬───────────────────┘
                                ▼
                          vuelve a IDLE
```

### Reglas

| Aspecto | Decisión |
|---|---|
| **Poción jugable** | Random del pool `findPlayable()` (pociones con `ingredients.length >= 1`). |
| **Cantidad de rounds** | Igual a `potion.ingredientIds.length`. Una poción con 3 ingredientes = 3 rounds. |
| **Cards por round** | 3 (1 correcta + 2 distractors). |
| **Generación de distractors** | 2 ingredientes random del pool global que NO estén en la receta actual. Detalle en ADR-0024. |
| **Orden de ingredientes a adivinar** | Random dentro de la receta (para que re-jugar la misma poción no sea idéntico). |
| **Acierto** | Click en card correcta → ingrediente se agrega al caldero → avanza al siguiente round. |
| **Pifia** | Click en card incorrecta → estado `LOST`, sin redención. |
| **Victoria** | Completar todos los rounds sin pifia. |
| **Dificultad** | Random pura en MVP (no ordenar por `potion.difficulty` — la mayoría viene `"Unknown"` y no es confiable). |
| **Timer** | Sin timer en MVP. |

### Scoring

**Score de sesión** = cantidad de ingredientes correctos en la partida actual (0 a `recipeSize`).

**High score persistente** = máximo histórico de `score de sesión` entre todas las partidas, guardado en `localStorage` con key `wizard-hub:potions-highscore` (sigue el patrón de `wizard-hub:wizardName` y `wizard-hub:theme` — ADR-0008, ADR-0013).

```ts
// lib/potions/storage.ts (siguiente ADR/PR)
const HIGH_SCORE_KEY = "wizard-hub:potions-highscore";

function readHighScore(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(HIGH_SCORE_KEY) ?? "0") || 0;
}

function saveHighScore(score: number): void {
  if (typeof window === "undefined") return;
  const current = readHighScore();
  if (score > current) localStorage.setItem(HIGH_SCORE_KEY, String(score));
}
```

El high score es **anónimo** — no depende de `wizardName`. Funciona tanto si el usuario se unió al fanclub como si no. Es consistente con la idea de "mejor racha personal" sin auth.

### UI por estado

| Estado | UI |
|---|---|
| **IDLE** | Hero con título "Brew a Potion" + CTA "Start brewing". Si hay high score > 0, mostrarlo como "Your best streak: N". |
| **PLAYING** | Poción actual (nombre + effect), progreso (`Round N of M`), caldero visual con ingredientes ya agregados, 3 cards de ingredientes. |
| **WON** | "Potion complete!" + stats (rondas, tiempo total) + "Play again". |
| **LOST** | "Potion failed!" + cuál era el ingrediente correcto + "Play again". |

### Sin redención

En MVP no hay "vidas" ni "reintentar el mismo round". Una pifia = partida terminada. Razones:

- Mantiene tensión (el juego se vuelve más estresante a medida que avanzás).
- Simplifica el modelo de estado.
- Genera más eventos `Potion Game Lost` para analytics (interés del user).

Si en el futuro se quiere suavizar, se abre un ADR sucesor con sistema de vidas.

### No se trackea "tiempo por round" en MVP

Sí se trackea `durationSec` total de la partida en `Potion Game Won` / `Potion Game Lost` (ADR-0025). No hay timer visual en MVP — eso iría en un ADR futuro si surge.

## Alternativas consideradas

| Alternativa | Por qué se descarta |
|---|---|
| **Vidas múltiples** (3 pifias = lose) | Reduce la tensión y complica el estado. MVP prioriza simplicidad. |
| **Timer por round** | Aumenta estrés pero agrega lógica de countdown + edge cases (timeout = pifia?). MVP lo evita. |
| **Score acumulativo entre partidas** (sin reset) | Confuso para UI. Mejor: streak por sesión + high score separado. |
| **High score vinculado a wizardName** (no anónimo) | Acopla a ADR-0008 unnecessarily. El usuario anónimo también puede jugar y tener high score. |
| **Dificultad progresiva** (ordenar por `potion.difficulty`) | La API devuelve casi todo como `"Unknown"`. No es confiable para MVP. |
| **Cards fijas (misma posición para correcta)** | Pone el `position` de analytics sin información. Mejor randomizar posición. |
| **Persistencia en Amplitude como user property** | Implica identificar al usuario anónimo con `identify()`, lo que rompe la idea de high score local. `localStorage` es suficiente. |

## Consecuencias

- **Positivas:**
  - MVP simple, jugable en < 200 LoC de game logic.
  - Máquina de estados clara (4 estados, ~5 transiciones).
  - High score en localStorage fomenta re-jugar (retención para analytics).
  - Genera eventos ricos para análisis (winrate, position bias, duración).
- **Negativas:**
  - "Sin redención" puede frustrar users que pifian en round 1. Mitigación: feedback visual claro de cuál era la correcta en estado `LOST`.
  - Sin timer, no podemos medir "reflejos". Para v2 si surge.
- **Riesgos / mitigaciones:**
  - **Recetas de 1 solo ingrediente** = partida de 1 round, poca satisfacción. Mitigación: en el adapter `findPlayable()` se puede forzar `ingredients.length >= 2` si la distribución lo justifica. Postergado a feat/016 — ver distribución real.
  - **Caldero visual simple en MVP** para no alargar el scope. Animación de "llenado" queda para feat/019 (visual polish).
- **Acciones derivadas:**
  - Crear `lib/potions/storage.ts` con `readHighScore` / `saveHighScore` (TDD: SSR-safe, número válido, max persistente).
  - Definir tipo `GameState = "idle" | "playing" | "won" | "lost"` en `lib/potions/types.ts`.
  - Implementar reducer de estado en `app/potions/game-reducer.ts` (TDD).
  - UI por estado en `feat/017-potions-mvp`.

## Notas

- Patrones referenciados: `wizard-hub:theme` (ADR-0013) y `wizard-hub:wizardName` (ADR-0008) para localStorage keys con prefijo `wizard-hub:`.
- Inspiración de game design: "Trivia crack" + "Hearthstone card picks" (3 opciones, 1 correcta, sin pifia permitida).
- Decisión sobre eventos (catálogo v1.2) vive en ADR-0025.
