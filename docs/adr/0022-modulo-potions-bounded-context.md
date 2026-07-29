# ADR-0022: Nuevo módulo `potions` (bounded context hexagonal)

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

El módulo Houses ya está implementado con el patrón hexagonal pragmático (ADR-0009): `modules/houses/{domain, application, infrastructure}`. Para mantener consistencia arquitectónica y seguir el principio "bounded contexts separados", Potions debe vivir en su propio módulo.

El spec de la API confirma la estructura de su endpoint `/Elixirs`:

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

**Crear `modules/potions/` siguiendo el mismo patrón hexagonal que Houses (ADR-0009).**

### Lenguaje ubicuo: dominio ≠ API

La API externa llama al recurso `/Elixirs`, pero **el dominio habla su propio idioma**. En el universo HP canónico, lo que el usuario prepara en clase de Snape es una **Potion**. La API es un detalle de infraestructura: el adapter traduce `ElixirResponse` (raw API type) → `Potion` (entidad de dominio).

> El día que la Wizard World API cambie de nombre o la reemplacemos por otra, el dominio NO debe enterarse. El adapter es el único punto que sabe de `/Elixirs`.

### Estructura

```
modules/potions/
├── domain/
│   ├── potion.ts                         # entidad Potion (API-agnostic)
│   ├── ingredient.ts                     # entidad Ingredient
│   └── potions-repository.port.ts        # interfaz (contrato)
├── application/
│   ├── get-all-potions.usecase.ts
│   ├── get-playable-potions.usecase.ts   # filtra ingredients.length >= 1
│   └── get-all-ingredients.usecase.ts
├── infrastructure/
│   └── wizard-world-potions.repository.ts  # adapter: llama /Elixirs, mapea a Potion
└── index.ts                              # composition root
```

### Entidades domain (canonical shapes)

```ts
// domain/potion.ts
export interface Potion {
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
// domain/potions-repository.port.ts
export interface PotionsRepository {
  findAll(): Promise<Potion[]>;
  findPlayable(): Promise<Potion[]>;       // ingredients.length >= 1
  findAllIngredients(): Promise<Ingredient[]>;
}
```

Justificación del port pese a tener una sola implementación: **idéntica a ADR-0009 §"Pragmatismo"** — existe para testabilidad (use cases testeables con mock, sin acoplarse a fetch).

### Fetching

Mismo patrón que Houses (ADR-0005): ISR con `revalidate: 86400` (24h). El adapter usa `wizardWorldFetch` + `tags: ['potions']` para invalidación selectiva.

### Filtrado de pociones jugables

El adapter `findPlayable()` filtra `ingredients.length >= 1` server-side. Esto evita que el cliente reciba pociones no jugables y tenga que filtrarlas, y mantiene la lógica de dominio encapsulada en el módulo.

### Ruta pública

`/potions` — consistente con el nombre del módulo, la entidad de dominio y el lenguaje ubicuo.

## Alternativas consideradas

| Alternativa | Por qué se descarta |
|---|---|
| **Módulo `elixirs` + ruta `/potions`** (mezcla) | Rompe el lenguaje ubicuo de DDD. El dominio debe hablar un solo idioma: o todo Potion o todo Elixir. |
| **Módulo `elixirs` + ruta `/elixirs`** | Técnicamente correcto, pero "Elixir" no es el término que usa el HP fandom para el juego (las clases de Snape son "Potions"). |
| **Meter Potions en `modules/houses/`** | Mezcla bounded contexts. Houses y Potions son conceptos diferentes del dominio HP. |
| **No crear entidad `Ingredient`** (usar raw `{id,name}` del API) | Funciona pero rompe consistencia con Houses (que tiene entidad `House`). También complica testear el juego (necesitamos crear ingredients de test). |
| **No usar port** (use cases llaman directo al adapter concreto) | Funciona pero pierde testabilidad aislada. ADR-0009 §"Pragmatismo" ya decidió lo contrario para Houses. |
| **Manejar `findPlayable` client-side** | Manda datos innecesarios al browser y filtra lógica de dominio en la UI. Mejor en el adapter. |

## Consecuencias

- **Positivas:**
  - Trazabilidad con Houses: patrón idéntico, fácil de mantener/escalar.
  - Lenguaje ubicuo consistente: dominio, código, URL y UI todos dicen "Potion".
  - El módulo encapsula la complejidad (fetch + filtrado + ISR) detrás de 3 use cases claros.
  - Testable: use cases se testean con mock repository, adapter con mock fetch.
  - Prepara el terreno para ADR-0024 (generación de distractors — el pool de ingredientes vive en este módulo).
  - Desacoplamiento API ↔ dominio: si mañana cambiamos la API, solo tocamos el adapter.
- **Negativas:**
  - Duplicación estructural con Houses (port, use case, adapter casi idénticos en forma). Pero **no en semántica**: Potion ≠ House, los use cases son diferentes (`findPlayable` no existe en Houses). ADR-0009 §"Pragmatismo" ya justifica: 2 implementaciones no justifican abstracción común.
  - Un módulo más para mantener.
- **Riesgos / mitigaciones:**
  - **Inestabilidad de la Wizard World API** (Heroku dormido): mismo `safeFetch` con fallback a `[]` que usa Houses. El juego detecta arrays vacíos y muestra mensaje "no potions available, try later".
  - **Listado de pociones grande** (~170 elixirs, ~162 ingredientes): payload ~30-50 KB. Aceptable para ISR con 24h revalidate. No paginar en MVP.
- **Acciones derivadas:**
  - Implementar estructura en `feat/016-potions-module-skeleton` (siguiente PR).
  - Extender `types/wizard-world.ts` con `ElixirResponse` y `IngredientResponse` (raw API types — viven en `types/` porque son tipos de infraestructura, no de dominio).
  - No tocar `modules/houses/` — los dos módulos coexisten sin dependencias cruzadas.

## Notas

- Inspiración: `modules/houses/` ya implementado (PR #2).
- Pattern: "Hexagonal Architecture / Ports & Adapters" — Alistair Cockburn.
- El adapter usará `wizardWorldFetch<T>` de `lib/api/wizard-world.client.ts` (helper existente, compartido con Houses).
- El adapter internamente llama a `/Elixirs` pero esto **NO filtra al dominio** — el mapping `ElixirResponse → Potion` es responsabilidad exclusiva del adapter.
