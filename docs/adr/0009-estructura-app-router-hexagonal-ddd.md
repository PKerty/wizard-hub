# ADR-0009: Estructura del proyecto — App Router + Hexagonal/DDD por módulo

- **Estado:** Aceptado
- **Fecha:** 2026-07-27
- **Decisor(es):** kerty + arquitecto
- **Relacionado:** ADR-0002 (Next.js), STRUCT-001

## Contexto
Necesitamos definir la organización de carpetas del frontend y la capa de servidor. Requisitos del usuario:

- **App Router** (default Next.js).
- Capa de backend con **arquitectura hexagonal** + **DDD** (bounded contexts).
- Bounded contexts iniciales: **Houses** (v1) → **Wizards** (v2).
- Mantener el principio de "no abstraer por abstraer": la arquitectura debe ser pragmática, no ceremonial.

## Decisión

### Layout general

```
wizard-hub/
├── app/                          # Next.js App Router (presentation)
│   ├── layout.tsx
│   ├── page.tsx                  # /
│   ├── houses/
│   │   ├── page.tsx              # /houses
│   │   └── [id]/page.tsx         # /houses/[id]
│   └── api/                      # Route Handlers (si hace falta; thin)
├── modules/                      # Bounded contexts (DDD)
│   ├── houses/
│   │   ├── domain/
│   │   │   ├── house.ts                  # Entity + value objects
│   │   │   └── house-repository.port.ts  # Interface (port)
│   │   ├── application/
│   │   │   ├── get-all-houses.usecase.ts
│   │   │   └── get-house-by-id.usecase.ts
│   │   └── infrastructure/
│   │       └── wizard-world-houses.repository.ts  # Adapter impl
│   └── wizards/                  # v2 — vacío por ahora, sólo placeholder en README
├── lib/                          # Cross-cutting
│   ├── analytics/                # ADR-0006
│   ├── api/
│   │   └── wizard-world.client.ts        # Shared HTTP client
│   └── config/
│       └── env.ts                        # typed env vars
├── components/                   # UI compartido (no domain-specific)
├── types/
│   └── wizard-world.ts           # API response types (raw)
└── tests/
    └── unit/                     # tests espejo de la estructura
```

### Reglas de capas (hexagonal pragmático)

| Capa | Puede importar | No puede importar |
|---|---|---|
| `domain/` | solo types de `types/` y sí mismo | nada de infra, app, lib con side-effects |
| `application/` (use cases) | `domain/`, tipos | `infrastructure/` concreto (solo el port) |
| `infrastructure/` (adapters) | `domain/` ports, `lib/` (HTTP client), tipos | `app/`, `application/` |
| `app/` (presentation) | `application/`, `components/`, `lib/` | `infrastructure/` directo (siempre vía use case) |

**Inversión de dependencias:** la capa `application/` declara el port (`house-repository.port.ts`); `infrastructure/` lo implementa; `app/` consume solo los use cases. Esto permite cambiar la fuente de datos (API real → mock en tests → cache Redis) sin tocar use cases ni UI.

### Pragmatismo (importante)
- **No crear capas vacías.** Si un use case es solo `return await repo.findAll()`, está bien — se justifica por la trazabilidad (punto único para logging, cache, etc.) pero no se duplican capas "por si algúndía".
- **No crear value objects sin comportamiento.** Un `HouseId` que es solo un `string` aliasado NO se justifica. Si no hay invariantes (validación, comparación), usar el tipo primitivo.
- **Siempre que la complejidad del dominio crezca**, refactor emerge — nunca anticipation.
- Los use cases son la **única** puerta de entrada al dominio desde la UI. Aunque sean finos.

## Alternativas consideradas
| Alternativa | Por qué se descarta |
|---|---|
| **Flat structure (`app/`, `components/`, `lib/`)** | Funciona para scope chico pero mezcla dominio con infra. Dificulta explicar arquitectura en la presentación. |
| **Feature folders sin hexagonal** (`features/houses/` con todo junto) | Pragmático pero perdés la inversión de dependencias; tests del dominio acoplados al fetch HTTP. |
| **Clean Architecture completa (4 capas + boundaries)** | Overkill para un catálogo que consume una API. Hexagonal con 3 capas es suficiente. |

## Consecuencias
- **Positivas:**
  - Dominio testeable sin HTTP ni mocks de fetch.
  - Agregar `modules/wizards/` no acopla con `modules/houses/`.
  - Narrativa clara para la presentación: "bounded contexts + ports & adapters".
  - Swap de vendor de la API o añadido de cache: 1 archivo (adapter).
- **Negativas / Riesgos:**
  - Más archivos que una flat structure. Aceptado por claridad.
  - Riesgo de "ceremonia" si creamos interfaces sin múltiples implementaciones. Mitigación: solo creamos un port si tenemos ≥2 implementaciones (real + mock de tests cuenta) o si está justificado por testabilidad.
- **Acciones derivadas:**
  - Definir config de path aliases en `tsconfig.json`: `@/app/*`, `@/modules/*`, `@/lib/*`, `@/components/*`, `@/types/*`.
  - ESLint rule para impedir imports prohibidos entre capas (ver ADR-0012 QA).

## Notas
- Patrón ports & adapters (a.k.a. hexagonal): Alistair Cockburn.
- DDD pragmático: Eric Evans + Vaughn Vernon, aplicado al "domain"待人 lightweight.
- Regla "no abstract for the sake of abstracting": ver §2 Principios en `AGENTS.md`.
