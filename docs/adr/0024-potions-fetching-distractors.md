# ADR-0024: Fetching y generación de distractors — Potions game

- **Estado:** Aceptado
- **Fecha:** 2026-07-28
- **Decisor(es):** kerty + arquitecto
- **Depende de:** [ADR-0022](./0022-modulo-potions-bounded-context.md) (módulo), [ADR-0023](./0023-potions-game-design.md) (reglas)
- **Habilita:** feat/016 (módulo skeleton), feat/017 (game MVP)

## Contexto

ADR-0023 definió la mecánica: por cada round, mostrar **3 cards** (1 ingrediente correcto + 2 distractors). Falta precisar:

1. **Dónde y cuándo se hace el random** — si en el server (SSR/SSG/ISR) o en el client.
2. **Cómo se generan los 2 distractors** — pool de dónde sacar, reglas de exclusión, repetición entre rounds.
3. **Cómo se elige la poción jugable** — random uniforme o ponderada.
4. **Casos edge** — recetas de 1 solo ingrediente, pool chico de distractores, recarga de página.
5. **Arquitectura de la página `/potions`** — qué es server component y qué es client.

ADR-0005 (data fetching) y ADR-0022 ya fijaron ISR `revalidate: 86400` para los endpoints de la Wizard World API. Este ADR trabaja encima.

## Decisión

### 1. Arquitectura: Server Component + Client Component

```
app/potions/
├── page.tsx                  # Server Component (SSG)
│   - getPlayablePotions()
│   - getAllIngredients()
│   - pasa como props al client
└── potion-game.tsx           # Client Component ("use client")
    - state machine del juego
    - random client-side
    - render de cards y caldero
```

La página `/potions` se **prerendera en build time (SSG)**: el server component ejecuta los use cases, recibe las pociones jugables + el pool de ingredientes, y los pasa al client game component como props serializadas. El client component no hace fetch; solo consume props y maneja estado.

### 2. Randomización es client-side

El random (selección de poción jugable, generación de distractors, shuffle de cards) **se hace en el browser**, no en el server. Razones:

- ISR cachea el **listado completo**; si randomizara en server, cada render saldría distinto y rompería la cache.
- Permite "Play again" sin redescargar (cambia solo el random state).
- Compatible con React state (sin hidratación mismatch: server entrega props estáticas, client computa random tras mount).

### 3. Selección de poción jugable

```ts
const potion = playablePotions[Math.floor(Math.random() * playablePotions.length)];
```

Random **uniforme** — sin ponderar por `difficulty` (la mayoría viene `"Unknown"` según auditoría de la API; no es confiable).

### 4. Pool de distractores y generación por round

Por cada round del juego:

```ts
const correctIngredient = potion.ingredientIds[round]; // ya randomizado el orden
const pool = allIngredients.filter(ing => !potion.ingredientIds.includes(ing.id));
const distractors = shuffle(pool).slice(0, 2);
const cards = shuffle([correctIngredient, ...distractors]);
```

Reglas:

- **Pool = todos los ingredientes globales menos los de la receta actual** (para evitar que aparezca un distractor que sea en realidad otro ingrediente correcto).
- **2 distractors por round**, elegidos con `Math.random()` + `shuffle().slice(0, 2)`.
- **Pueden repetirse entre rounds** de la misma partida. MVP no exige exclusividad. Si v2 quiere fairness, se upgradea con un `Set` de ya-usados.
- **Cards finales**: shuffle para que la posición del correcto varíe (relevante para analytics de `position` — ADR-0025).

### 5. Orden de ingredientes a adivinar

`shuffle(potion.ingredientIds)` al iniciar la partida. Cada round consume el siguiente id del array ya barajado. Si la misma poción sale en dos partidas distintas, el orden puede ser diferente (mejor rejugabilidad).

### 6. Casos edge

| Edge case | Comportamiento |
|---|---|
| **Pociones con 1 solo ingrediente** | En `findPlayable()` filtrar a `ingredients.length >= 2`. Evita partidas de 1 round que son triviales. Si la distribución real (ver feat/016) muestra que esto deja muy pocas jugables, ajustar a `>= 1`. |
| **Pool global chico** (hipotético) | Con ~162 ingredientes globales y recetas de hasta 6, siempre hay ≥ 150 distractores posibles. No aplica en MVP. |
| **API caída** (Heroku dormido) | `safeFetch` del adapter devuelve `[]` → el server component renderiza "no potions available, try later" sin romper build. |
| **Recarga de página durante partida** | Se pierde el state (es ephemeral client-side). El high score persiste (localStorage). Trade-off aceptado. |

### 7. Helper de shuffle

Crear `lib/potions/random.ts` con:

```ts
export function shuffle<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
```

Algoritmo: **Fisher-Yates** (sin sesgo). TDD: `shuffle` no altera longitud, `pickRandom` retorna elemento del array.

## Alternativas consideradas

| Alternativa | Por qué se descarta |
|---|---|
| **Random server-side con \`Math.random()\` en el RSC** | Rompe ISR (cada build/render da resultado distinto). Y entre requests dentro del mismo cache podría dar hidratación mismatch. |
| **Random server-side con seed determinístico** | Complejiza sin ganar nada relevante para el challenge. El "Play again" sí o sí requiere client-side. |
| **Fetch en client-side con React Query/SWR** | Agrega latencia en cada "Play again" y acopla el juego al estado de la API en runtime. Mejor pre-cargar todo en build time. |
| **Distractors únicos por partida** (sin repetir entre rounds) | Para pociones con 6 ingredientes reduce el pool disponible, pero no es crítico. Postergado a v2 si los analytics lo piden. |
| **Filtrar \`difficulty\`** para progresión | API no es confiable (`Unknown` dominante). Postergado. |
| **Algoritmo \`sort(() => Math.random() - 0.5)\`** | Malo — sesgo documentado. Fisher-Yates es el estándar. |
| **Pool global sin filtrar receta** | Si el pool incluye un ingrediente que es correcto en otro round de la misma receta, el usuario puede confundirse. Filtrar receta entera es más justo. |

## Consecuencias

- **Positivas:**
  - Cache 100% estático en `/potions` → carga instantánea sin API call runtime.
  - Re-jugabilidad sin latencia.
  - "Play again" no requiere network.
  - Posición de card correcta varía → habilita análisis de bias (ADR-0025).
  - Resistente a API dormida (datos en build).
- **Negativas:**
  - Página `/potions` se prerendera con datos de build; si la API agrega pociones nuevas, hay que redeployar para verlas. Mitigación: Vercel redeploya automáticamente cada 24h vía ISR.
  - Random client-side puede generar patrón idéntico entre dos sesiones (probabilidad baja pero no cero). Aceptable para MVP no-cryptographic.
  - Payload de ~30-50 KB transferido al cliente en el bundle inicial del juego. Aceptable para Vercel Hobby.
- **Riesgos / mitigaciones:**
  - **Distribución real de pociones jugables**: si `ingredients.length >= 2` deja < 50 pociones, ajustar a `>= 1`. Verificar en feat/016 con un log temporal.
  - **Hidratación**: random SOLO se ejecuta dentro de effects/event handlers, nunca en el render inicial del client component. El primer render del client debe ser `state === 'idle'` (sin random).
- **Acciones derivadas:**
  - `lib/potions/random.ts` con `shuffle` + `pickRandom` + tests.
  - `lib/potions/storage.ts` (high score, ya cubierto en ADR-0023).
  - Adapter `findPlayable()` con filtro `ingredients.length >= 2` (validar en feat/016).
  - Server Component en `app/potions/page.tsx` con `export const revalidate = 86400`.

## Notas

- Fisher-Yates shuffle: <https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle>
- "Math.random sort" es mala práctica: <https://stackoverflow.com/questions/962802/>
- ISR en Next.js App Router: <https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration>
- El random client-side corre en el browser, no en edge/worker. Para SSR-safe code, ver patrón en `lib/user/index.ts` (ADR-0008).
