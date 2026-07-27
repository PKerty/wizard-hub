# ADR-0012: Estrategia de calidad — lint, format, typecheck, tests TDD

- **Estado:** Aceptado
- **Fecha:** 2026-07-27
- **Decisor(es):** kerty + arquitecto
- **Relacionado:** ADR-0003 (TypeScript), ADR-0011 (Git), QA-001

## Contexto
Necesitamos tooling de calidad que:
- Sea enforceable en CI (pre-merge + pre-deploy).
- Cubra lint, formatting, typecheck y tests unitarios.
- Alinee con el principio "TDD desde el caso degenerate" (Uncle Bob).
- No frene el minimal inicial pero escale cuando el proyecto crezca.

## Decisión

### Stack de tooling

| Propósito | Herramienta | Razón |
|---|---|---|
| **Lint** | ESLint + `eslint-config-next` + `@typescript-eslint` | Recomendado oficial por Next.js; reglas TS estrictas. |
| **Formatting** | Prettier + `eslint-config-prettier` | Estándar de facto; delegar formato, ESLint se enfoca en bugs. |
| **Typecheck** | `tsc --noEmit` | Gate de tipos (TS strict ya activo por ADR-0003). |
| **Tests unitarios** | **Vitest** + `@testing-library/react` (para componentes) | Más rápido que Jest, ESM nativo, compatible con Vite/Next. |
| **Hooks** | `husky` + `lint-staged` + `commitlint` | Pre-commit corre lint/format; commit-msg valida Conventional Commits. |
| **CI** | GitHub Actions | Workflow corre las 4 gates en cada PR. |

### Gates (en orden, fail-fast)

```bash
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint .
pnpm test        # vitest run
pnpm build       # next build (sólo en CI, no pre-commit)
```

**Pre-commit** (rápido, vía `lint-staged`): lint + format solo en archivos staged.
**Pre-merge (CI)**: typecheck + lint completo + tests + build.

### TDD como regla

**Workflow obligatorio** para cualquier código de dominio, use cases, o lógica no trivial:

1. **RED** — escribir el test más simple posible (caso degenerate / happy path mínimo). Verificar que falla por la razón esperada.
2. **GREEN** — implementar lo mínimo para que el test pase. No más.
3. **REFACTOR** — mejorar estructura sin cambiar comportamiento. Tests siguen en verde.

**Reglas adicionales:**
- **No se merguea PR sin tests** para nueva lógica de dominio/application/infrastructure. Componentes de presentación pura pueden exceptuarse si son triviales (string-only JSX).
- **Cobertura no es gate duro** en v1 — pero se reporta en CI para visibilidad. Umbral se define cuando el suite madure.
- **Tests unitarios solo** en v1. Integration/E2E se discuten en ADR futuro si el scope lo justifica.

### Estructura de tests

```
modules/houses/
├── application/
│   ├── get-all-houses.usecase.ts
│   └── get-all-houses.usecase.test.ts     # al lado del source
└── infrastructure/
    ├── wizard-world-houses.repository.ts
    └── wizard-world-houses.repository.test.ts
```

Co-locación: `<file>.test.ts` al lado del `<file>.ts`. Más fácil de encontrar que en árbol paralelo.

## Alternativas consideradas
| Alternativa | Por qué se descarta |
|---|---|
| **Jest** | Setup más pesado en proyectos ESM/Next; Vitest da misma API sin overhead. |
| **Playwright/E2E desde v1** | Overkill; añadimos cuando hay flujo crítico de usuario estable. |
| **Biome (lint+format unificado)** | Prometedor pero ecosistema de plugins más chico que ESLint. Reevaluar en futuro ADR. |
| **Coverage threshold estricto (80%+)** | Incentiva tests sin valor sólo para subir el número. TDD orgánico > métrica ciega. |
| **Tests-first pero sin ciclo TDD explícito** | Pierde el rigor. El ciclo RED-GREEN-REFACTOR es lo que protege el diseño. |

## Consecuencias
- **Positivas:**
  - 4 gates automáticos antes de cada merge → menos bugs en `master`.
  - TDD fuerza interfaces pequeñas y diseño testeable → alinea con ADR-0009 (hexagonal).
  - Vitest da feedback loop de ms → no rompe el ritmo de desarrollo.
- **Negativas / Riesgos:**
  - Curva inicial de setup (p.ej. configurar jsdom para tests de componentes).
  - Riesgo de "test por cumplir" si TDD se vuelve ceremonia. Mitigación: revisión en PR enfocada en calidad de tests, no cantidad.
  - Tiempo de CI: si crece mucho, paralelizar jobs.
- **Acciones derivadas:**
  - `package.json` scripts: `typecheck`, `lint`, `test`, `test:watch`, `build`.
  - `.eslintrc` / `eslint.config.js` con `next/core-web-vitals` + `@typescript-eslint/recommended` + reglas de imports entre capas (ADR-0009).
  - `vitest.config.ts` con environment `jsdom` para tests de componentes.
  - `.husky/pre-commit` y `.husky/commit-msg`.
  - `commitlint.config.js` con `@commitlint/config-conventional`.
  - `.github/workflows/ci.yml` con los 4 gates.

## Notas
- Uncle Bob (Robert C. Martin), *Clean Code* / *Test Driven Development* — ciclo RED-GREEN-REFACTOR.
- Vitest: https://vitest.dev/
- Conventional Commits: ver ADR-0011.
