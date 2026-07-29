# ADR-0026: Cliente HTTP compartido — `wizardWorldFetchSafe`

- **Estado:** Aceptado
- **Fecha:** 2026-07-29
- **Decisor(es):** kerty + arquitecto
- **Relacionado:** [ADR-0005](./0005-data-fetching-ssg-isr.md) (ISR), [ADR-0009](./0009-estructura-app-router-hexagonal-ddd.md) (estructura), [ADR-0022](./0022-modulo-potions-bounded-context.md) (módulo potions)

## Contexto

Tras introducir el módulo `potions` (ADR-0022 / PR #20), el helper `safeFetch` —un `try/catch` que loguea el error y devuelve un `fallback` para que una API caída no rompa el build ISR— quedó **duplicado en dos adapters**:

- `modules/houses/infrastructure/wizard-world-houses.repository.ts`
- `modules/potions/infrastructure/wizard-world-potions.repository.ts`

Son copias casi idénticas: mismo envoltorio, mismo manejo de `WizardWorldApiError`, mismo `console.warn`. La regla de tres de ADR-0009 §"Pragmatismo" tolera duplicar hasta 2 veces y abstraer a la 3ª. Estamos en la 2ª, pero:

1. El contrato es **infraestructura compartida** (resiliencia ante la Wizard World API), no detalle de un módulo.
2. Cualquier módulo nuevo que consuma la API (Wizards, etc.) volverá a copiarlo.
3. El usuario lo pidió explícitamente y el beneficio del punto único de error-handling/logging es claro.

Auditoría previa: `wizardWorldFetch` (la primitiva que lanza) se usa **únicamente** dentro de los `safeFetch` locales —nadie la llama directo sin el wrapper resiliente.

## Decisión

**Centralizar el fetch resiliente en `lib/api/wizard-world.client.ts` con dos funciones explícitas:**

```ts
// Primitiva: ejecuta el fetch y LANZA WizardWorldApiError si !res.ok (building block).
export async function wizardWorldFetch<T>(
  path: string,
  options?: { revalidate?: number; tags?: string[] },
): Promise<T>;

// Wrapper resiliente: loguea el error y devuelve `fallback` en vez de lanzar.
export async function wizardWorldFetchSafe<T>(
  path: string,
  options: {
    fallback: T;
    context: string;            // label de log, p.ej. "houses/findAll"
    revalidate?: number;
    tags?: string[];
  },
): Promise<T>;
```

Ambos adapters eliminan su `safeFetch` local y llaman a `wizardWorldFetchSafe`. Ejemplo:

```ts
const raw = await wizardWorldFetchSafe<ElixirResponse[]>("/Elixirs", {
  fallback: [],
  context: "potions/findAll",
  revalidate: 86400,
  tags: ["potions"],
});
```

### Por qué dos funciones (y no una con `fallback` opcional)

- **Intención explícita en el call site**: quien lee `wizardWorldFetchSafe` sabe que esa llamada es tolerante a fallos; quien lee `wizardWorldFetch` sabe que puede lanzar y debe tratarlo.
- Evita la "magia" de una función que a veces lanza y a veces no según un flag.
- `wizardWorldFetch` queda como primitiva reutilizable (la consume internamente el wrapper; deja la puerta a futuras llamadas que sí quieran propagar el error, p.ej. mutations/server actions).

### Formato de log

Pasa de `[houses] API error during findAll: …` a `[houses/findAll] API error: …` (un solo label `module/op`). Más compacto y parseable.

## Alternativas consideradas

| Alternativa | Por qué se descarta |
|---|---|
| **Una sola función con `fallback` opcional** | Mezcla "lanza / no lanza" según un flag. Sorpresivo al leer; propenso a errores (olvidar el fallback = comportamiento distinto). |
| **Esperar a la 3ª duplicación** (regla de tres estricta) | El contrato ya es infra compartida con 2 consumidores y un tercero seguro (módulo Wizards futuro). Adelantar la abstracción elimina copia/deriva hoy. |
| **Clase `WizardWorldClient` con métodos tipados** (`client.houses.all()`, `client.potions.playable()`) | Sobre-ingeniería para 2 callers; acopla el cliente a nombres de módulo. Las funciones sueltas son suficientes (ADR §"No sobre-ingeniar"). |
| **Eliminar `wizardWorldFetch` y dejar solo el safe** | Pierde la primitiva explícita. Hoy todo es safe, pero mantener el building block de lanzar documenta el contrato de bajo nivel y cuesta poco. |

## Consecuencias

- **Positivas:**
  - Un único punto para error-handling + logging de la Wizard World API.
  - Houses y Potions pierden ~16 LoC de duplicación cada uno.
  - Patrón fijado para futuros módulos (Wizards): consumir `wizardWorldFetchSafe`, sin reescribir try/catch.
  - Tests unitarios del cliente en un solo lugar (no por adapter).
- **Negativas:**
  - Un export más en el shared client (despreciable).
  - `wizardWorldFetch` queda con un solo consumidor interno hoy (el wrapper). Aceptado: documenta el contrato primitivo.
- **Riesgos / mitigaciones:**
  - **Cambio de formato de log** (`[module] … during op` → `[module/op] …`): los logs viejos (si alguien los parsea) cambian. No hay consumidores de estos logs hoy (solo `console.warn` a runtime). Aceptado.
  - **Refactor toca Houses (código en producción)**: mitigado con tests existentes del adapter Houses + los nuevos del client shared. Comportamiento observable (fallback + log) se preserva.
- **Acciones derivadas:**
  - Agregar `wizardWorldFetchSafe` + test unitario a `lib/api/wizard-world.client.ts`.
  - Refactor `wizard-world-houses.repository.ts` y `wizard-world-potions.repository.ts`.
  - Este ADR actualiza implícitamente la nota de ADR-0022 §"Notas" (que decía "el adapter usará `wizardWorldFetch`"): el adapter ahora usa `wizardWorldFetchSafe`.

## Notas

- Resiliencia ya justificada en el LLD (`docs/diagrams/lld-house-detail.md` §"safeFetch") y en ADR-0022 §"Riesgos" (Heroku dormido).
- Patrón "primitive + safe wrapper" es análogo a cómo el ecosistema separa `fetch` de helpers con retry/timeout.
