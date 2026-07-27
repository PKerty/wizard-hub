# AGENTS.md — wizard-hub

Guía de trabajo para agentes (humanos o IA) que operan en este repositorio. Lee este archivo antes de tocar código.

---

## 1. Qué es wizard-hub

Web application para el fanclub de Harry Potter, cuyo objetivo es **guiar a nuevos miembros dentro del mundo de Hogwarts**. Surge de un challenge de Solutions Architect con dos fases:

| Fase | Objetivo resumido |
|------|-------------------|
| **Implementación** | Web app que consume la [Wizard World API](https://wizard-world-api.herokuapp.com/) (`/Houses`, `/Houses/:id`) + instrumentación de **Amplitude** (page views + ≥5 eventos de interacción). Entregables: HLD, LLD, repo GitHub, hosting (deseable). |
| **Presentación** | Tech overview, intro a Amplitude (events/users/properties, ciclo de vida anónimo→conocido) y dashboard con dos métricas: *Most viewed House (Unique Users)* y *All Houses Viewed by Platform (Event Totals)*. |

Documento original del challenge: `docs/Challenge - Solutions Architect (2) (2).pdf`.

---

## 2. Principios de trabajo

1. **Minimal primero, luego ampliar.** Cada incremento debe ser desplegable y útil por sí mismo.
2. **Decision-driven.** Antes de implementar algo "significativo", queda registrado como ADR (ver §4). Si una decisión ya está en un ADR, no se contradice en el código sin uno nuevo.
3. **Trazabilidad para la presentación.** Todo lo que hagamos debe poder defenderse en la fase de presentación: arquitectura, trade-offs, métricas.
4. **No sobre-ingeniar.** Elegir la opción más simple que cumpla los requisitos del challenge; documentar el techo de escala esperado en el ADR correspondiente.
5. **Sin secretos en el repo.** Las API keys de Amplitude y cualquier credencial van por variables de entorno (ver ADR futuro de configuración).
6. **No abstraer por abstraer.** Una abstracción se introduce cuando hay un claro beneficio (≥2 consumidores reales, testabilidad crítica, o swap de implementación probable). Nunca por anticipación. Si una interfaz/clase base tiene una sola implementación y no se justifica por tests, **no se crea**.
7. **DRY con juicio.** Se respeta DRY, pero un poco de duplicación es preferible a una abstracción prematura errónea ("wrong abstraction" cuesta más que el duplicado). La regla de tres: se tolera duplicar 2 veces, a la 3ra se abstrae.
8. **TDD sí o sí para lógica no trivial.** Ciclo RED → GREEN → REFACTOR. Siempre empezar por el **caso degenerate** (el más simple posible) y crecer de ahí. Ver ADR-0012.
9. **PRs autocontenidos.** ≤300 líneas de diff (excluyendo lockfiles/snapshots), 1 feature lógica por PR. Si la feature es grande, se parte en múltiples PRs. Ver ADR-0011.

---

## 3. Estructura del repositorio (actual)

```
wizard-hub/
├── AGENTS.md                # este archivo
├── docs/
│   ├── Challenge*.pdf       # enunciado original
│   ├── diagrams/            # HLD, LLD en Mermaid (por crear — ADR-0010)
│   ├── design-system.md     # spec canónico de identidad visual (ADR-0013)
│   └── adr/                 # 13 ADRs aceptados (ver índice §4)
├── app/                     # Next.js App Router (por scaffoldear — ADR-0009)
├── modules/                 # bounded contexts DDD (Houses v1, Wizards v2)
├── lib/                     # analytics, api client, config
├── components/              # UI compartido
└── types/                   # API response types
```

Detalle de capas y reglas de imports: ADR-0009.

---

## 4. Sistema de registros: ADRs

Mecanismo oficial para registrar decisiones. Reglas completas en `docs/adr/0001-adoptar-adrs.md`.

**Flujo:**
1. Al tomar una decisión significativa → crear `docs/adr/NNNN-titulo.md` desde `0000-template.md`.
2. Estado inicial: `Propuesto`. Pasar a `Aceptado` cuando se confirma.
3. Para revertir/cambiar → nuevo ADR que `Reemplaza` o `Desestima` al anterior.

**Índice de ADRs** (mantener ordenado por número):

| # | Título | Estado |
|---|--------|--------|
| 0001 | Adoptar Architecture Decision Records (ADRs) | Aceptado |
| 0002 | Adoptar Next.js como framework frontend/fullstack | Aceptado |
| 0003 | Adoptar TypeScript como lenguaje principal | Aceptado |
| 0004 | Deploy en Vercel (Hobby plan) | Aceptado |
| 0005 | Estrategia de data fetching — SSG + ISR | Aceptado |
| 0006 | Integración de Amplitude — wrapper propio tipado | Aceptado |
| 0007 | Taxonomía de eventos de Amplitude | Aceptado |
| 0008 | User lifecycle — anónimo → conocido | Aceptado |
| 0009 | Estructura del proyecto — App Router + Hexagonal/DDD por módulo | Aceptado |
| 0010 | Diagramas — Mermaid en el repo | Aceptado |
| 0011 | Estrategia de Git — branches feature-based numeradas + PRs autocontenidos | Aceptado |
| 0012 | Estrategia de calidad — lint, format, typecheck, tests TDD | Aceptado |
| 0013 | Identidad visual — "Moonlit Armor" (iridiscente esotérico) | Aceptado |
| 0014 | Stack CSS — Tailwind CSS | Aceptado |
| 0015 | Icon set — custom SVG heráldico/esotérico | Aceptado |
| 0016 | Ilustración — line-art tipo "Marauder's Map" | Aceptado |
| 0017 | Migración a `@amplitude/unified` (reemplaza parte de ADR-0006) | Aceptado |

---

## 5. Decisiones pendientes (a resolver a continuación)

Estos son los puntos que aún **no** están decididos y bloquean o canalizan el resto del trabajo. Cada uno será un ADR:

- **STACK-001** Framework frontend — ✅ Resuelto en ADR-0002: **Next.js** (App Router, deploy Vercel Hobby).
- **STACK-002** Lenguaje principal y tipado — ✅ Resuelto en ADR-0003: **TypeScript** en modo `strict`.
- **STACK-003** Estrategia de data fetching y cache — ✅ Resuelto en ADR-0005: **SSG + ISR** (SSG home, ISR catálogo).
- **HOST-001** Hosting — ✅ Resuelto en ADR-0004: **Vercel Hobby**.
- **DIAG-001** Notación y herramienta para HLD/LLD (Mermaid en repo, Excalidraw, etc.).
- **AMP-001** Forma de integrar Amplitude — ✅ Resuelto en ADR-0006: **wrapper propio tipado** sobre `@amplitude/analytics-browser`.
- **AMP-002** Modelo de eventos (nomenclatura, propiedades, user properties) — ✅ Resuelto en ADR-0007: **catálogo v1** (7 eventos) + **v2** (search/scroll, futuro).
- **AMP-003** Estrategia de user lifecycle (anónimo → identificado) — ✅ Resuelto en ADR-0008: **form "Únete al fanclub"** (email + wizardName + favoriteHouse), sin auth real.
- **STRUCT-001** Organización de carpetas del frontend — ✅ Resuelto en ADR-0009: **App Router + módulos DDD con hexagonal pragmático**.
- **QA-001** Estrategia mínima de calidad (lint, typecheck, tests) — ✅ Resuelto en ADR-0012: **ESLint + Prettier + tsc + Vitest + husky + CI**, TDD obligatorio.
- **REPO-001** Estrategia de Git — ✅ Resuelto en ADR-0011: **branches `type/NNN-slug` + Conventional Commits + PRs ≤300 LoC**.

## 5-bis. Convenciones quick-reference

Resumen ejecutivo. Detalle en los ADRs.

| Tema | Convención | ADR |
|---|---|---|
| Lenguaje | TypeScript strict | 0003 |
| Framework | Next.js App Router | 0002 |
| Hosting | Vercel Hobby | 0004 |
| Fetching | SSG home + ISR catálogo (`revalidate: 86400`) | 0005 |
| Amplitude | wrapper tipado en `lib/analytics/` | 0006, 0017 |
| Eventos | Title Case + camelCase props; catálogo finito v1 | 0007 |
| Identidad | `setUserId(email)` al unirse; sin auth real | 0008 |
| Estructura | `app/` + `modules/<context>/{domain,application,infrastructure}` + `lib/` | 0009 |
| Diagramas | Mermaid en `docs/diagrams/` | 0010 |
| Branches | `<type>/NNN-<slug>` | 0011 |
| Commits | Conventional Commits (`feat(houses): ...`) | 0011 |
| PRs | ≤300 LoC diff, self-contained, 1 feature | 0011 |
| Lint | ESLint + Prettier + eslint-config-next | 0012 |
| Tests | Vitest, TDD RED-GREEN-REFACTOR desde degenerate case | 0012 |
| Hooks | husky pre-commit (lint-staged) + commit-msg (commitlint) | 0012 |
| Visual | "Moonlit Armor" — acero iridiscente esotérico (spec en `docs/design-system.md`) | 0013 |
| CSS | Tailwind CSS (tokens → `tailwind.config.ts`) | 0014 |
| Iconos | Custom SVG heráldico/esotérico (sin libraries) | 0015 |
| Ilustración | Line-art tipo Marauder's Map (1 hero + 4 ornamentos en v1) | 0016 |

---

## 6. Cómo trabajar en este repo (para agentes IA)

- **Antes de proponer stack o patrones**, consulta las decisiones pendientes y los ADRs aceptados.
- **No agregues comentarios** al código salvo pedido explícito (regla general del agente).
- **No hagas commit** salvo pedido explícito.
- **Verifica** con `lint`/`typecheck`/`tests` lo que toques, una vez exista tooling.
- **Sugiére** registrar ADRs cuando una decisión técnica sea "significativa".
- **Idioma:** la comunicación con el usuario es en español; código e identificadores en inglés.

---

## 7. Recursos externos

- **API:** Wizard World API — `https://wizard-world-api.herokuapp.com/` (endpoints: `/Houses`, `/Houses/{id}` con subrecursos `heads` y `traits`). Nota: el dominio `wizard-world-api.com` está muerto; el host real es Heroku.
- **Analytics:** Amplitude Docs y Amplitude Help Center (referenciados por el challenge).
- Diagramas: ver ADR-0010 (Mermaid en `docs/diagrams/`).
