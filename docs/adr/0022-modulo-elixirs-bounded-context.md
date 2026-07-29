# ADR-0022: Nuevo módulo `elixirs` (bounded context hexagonal)

- **Estado:** Aceptado
- **Fecha:** 2026-07-28
- **Decisor(es):** kerty + arquitecto
- **Relacionado:** [ADR-0009](./0009-estructura-app-router-hexagonal-ddd.md) (estructura hexagonal/DDD por módulo), [ADR-0005](./0005-data-fetching-ssg-isr.md) (ISR), [ADR-0010](./0010-diagramas-mermaid.md) (diagramas)
- **Habilita:** ADR-0023 (Potions game design), ADR-0024 (fetching + distractors)

## Contexto

Fase 2 del challenge: agregar un **juego de pociones** que consume los endpoints `/Elixirs` y `/Ingredients` de la Wizard World API. La mecánica requiere:

1. Una poción jugable (con receta de ≥1 ingrediente).
2. Un pool global de ingredientes para generar distractors.
3. Lógica de "filtrado de pociones jugables" (algunas vienen con `ingredients: []` vacío).

El módulo Houses ya está implementado con el patrón hexagonal pragmático (ADR-0009): `modules/houses/{domain, application, infrastructure}`. Para mantener consistencia arquitectónica y seguir el principio "bounded contexts separados", Elixirs debe vivir en su propio módulo.

El spec de la API confirma la estructura:

```json
// /Elixirs/{id}
{
  "id": "...",
  "name": "Fergus Fungal Budge",
  "effect": "Treats ringworm, fungicide",
  "sideEffects": "...",
  "difficulty": "Unknown",
  "ingredients": [{ "id": "...", "name": "Neem oil" }, ...],
  "inventors": [],
  "manufacturer": null
}

// /Ingredients
[{ "id": "...", "name": "Newt spleens" }, ...]  // 162 ingredientes
```

## Decisión

**Crear `modules/elixirs/` siguiendo el mismo patrón hexagonal que Houses (ADR-0009).**

### Estructura

```
modules/elixirs/
├── domain/
│   ├── elixir.ts                          # entidad Elixir (API-agnostic)
│   ├── ingredient.ts                      # entidad Ingredient
│   └── elixirs-repository.port.ts         # interfaz (contrato)
├── application/
│   ├── get-all-elixirs.usecase.ts
│   ├── get-playable-elixirs.usecase.ts    # filtra ingredients.length >= 1
│   └── get-all-ingredients.usecase.ts
├── infrastructure/
│   └── wizard-world-elixirs.repository.ts # adapter con safeFetch + ISR
└── index.ts                               # composition root
```

### Entidades domain (canonical shapes)

```ts
// domain/elixir.ts
export interface Elixir {
  id: string;
  name: string;
  effect: string | null;
  difficulty: string | null;       // "Unknown" | "Beginner" | "Advanced" | etc.
  ingredientIds: string[];          // solo ids — los names se resuelven vía Ingredient
  ingredientNames: string[];        // paralelo a ingredientIds, para UI/distractors
}

// domain/ingredient.ts
export interface Ingredient {
  id: string;
  name: string;
}
```

### Port (contrato)

```ts
// domain/elixirs-repository.port.ts
export interface ElixirsRepository {
  findAll(): Promise<Elixir[]>;
  findPlayable(): Promise<Elixir[]>;       // ingredients.length >= 1
  findAllIngredients(): Promise<Ingredient[]>;
}
```

Justificación del port pese a tener una sola implementación: **idéntica a ADR-0009 §"Pragmatismo"** — existe para testabilidad (use cases testeables con mock, sin acoplarse a fetch).

### Ruta pública

La URL pública será **`/potions`** (NO `/elixirs`), porque:

- Más amigable y memorable para usuarios no técnicos.
- "Potions" es el término que usa el HP fandom para el juego (las clases de Snape).
- El nombre interno del módulo sigue siendo `elixirs` para matchear la API.

### Fetching

Mismo patrón que Houses (ADR-0005): ISR con `revalidate: 86400` (24h). El adapter usa `wizardWorldFetch` + `tags: ['elixirs']` para invalidación selectiva.

### Filtrado de pociones jugables

El adapter `findPlayable()` filtra `ingredients.length >= 1` server-side. Esto evita que el cliente reciba pociones no jugables y tenga que filtrarlas, y mantiene la lógica de dominio encapsulada en el módulo.

## Alternativas consideradas

| Alternativa | Por qué se descarta |
|---|---|
| **Meter Elixirs en `modules/houses/`** | Mezcla bounded contexts. Houses y Elixirs son conceptos diferentes del dominio HP. |
| **No crear entidad `Ingredient`** (usar raw `{id,name}` del API) | Funciona pero rompe consistencia con Houses (que tiene entidad `House`). También complica testear el juego (necesitamos crear ingredients de test). |
| **Endpoint público `/elixirs`** (en vez de `/potions`) | Menos amigable. El usuario final no conoce "Elixirs" como término. |
| **No usar port** (use cases llaman directo al adapter concreto) | Funciona pero pierde testabilidad aislada. ADR-0009 §"Pragmatismo" ya decidió lo contrario para Houses. |
| **Manejar `findPlayable` client-side** | Manda datos innecesarios al browser y filtra lógica de dominio en la UI. Mejor en el adapter. |

## Consecuencias

- **Positivas:**
  - Trazabilidad con Houses: patrón idéntico, fácil de mantener/escalar.
  - El módulo encapsula la complejidad (fetch + filtrado + ISR) detrás de 3 use cases claros.
  - Testable: use cases se testean con mock repository, adapter con mock fetch.
  - Prepara el terreno para ADR-0024 (generación de distractors — el pool de ingredientes vive en este módulo).
- **Negativas:**
  - Duplicación estructural con Houses (port, use case, adapter casi idénticos en forma). Pero **no en semántica**: Elixir ≠ House, los use cases son diferentes (`findPlayable` no existe en Houses). ADR-0009 §"Pragmatismo" ya justifica: 2 implementaciones no justifican abstracción común.
  - Un módulo más para mantener.
- **Riesgos / mitigaciones:**
  - **Inestabilidad de la Wizard World API** (Heroku dormido): mismo `safeFetch` con fallback a `[]` que usa Houses. El juego detecta arrays vacíos y muestra mensaje "no potions available, try later".
  - **Listado de pociones grande** (~170 elixirs, ~162 ingredientes): payload ~30-50 KB. Aceptable para ISR con 24h revalidate. No paginar en MVP.
- **Acciones derivadas:**
  - Implementar estructura en `feat/016-elixirs-module-skeleton` (siguiente PR).
  - Extender `types/wizard-world.ts` con `ElixirResponse` y `IngredientResponse`.
  - No tocar `modules/houses/` — los dos módulos coexisten sin dependencias cruzadas.

## Notas

- Inspiración: `modules/houses/` ya implementado (PR #2).
- Pattern: "Hexagonal Architecture / Ports & Adapters" — Alistair Cockburn.
- El adapter usará `wizardWorldFetch<T>` de `lib/api/wizard-world.client.ts` (helper existente, compartido con Houses).
