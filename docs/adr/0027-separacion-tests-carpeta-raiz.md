# ADR-0027: Separación de tests — `tests/` raíz espejando src

- **Estado:** Aceptado
- **Fecha:** 2026-07-29
- **Decisor(es):** kerty + arquitecto
- **Reemplaza (parcialmente):** [ADR-0012](./0012-estrategia-calidad.md) §"Estructura de tests" (co-locación `<file>.test.ts` al lado del `<file>.ts`)

## Contexto

ADR-0012 §"Estructura de tests" estableció la **co-locación**: `<file>.test.ts` junto a `<file>.ts`, con la justificación "más fácil de encontrar que en árbol paralelo". Tras varios módulos (Houses, analytics, user, theme, api, potions, components), el árbol de src quedó con archivos de implementación y de test mezclados en cada carpeta.

El usuario prefiere que las carpetas de src contengan **solo implementación**, con los tests en una ubicación separada y consistente.

## Decisión

**Mover todos los tests unitarios a una carpeta `tests/` raíz que espeja la estructura de src**, eliminando la co-locación.

```
src (implementación, sin tests):
  app/  components/  lib/  modules/  types/

tests/ (espeja 1:1 la estructura de src):
  tests/modules/potions/application/get-all-potions.test.ts
  tests/lib/potions/random.test.ts
  tests/components/houses/house-card.test.tsx
  tests/app/join/join-form.test.tsx
  tests/setup.ts   # (ya existía)
```

### Convenciones

- **Imports en tests → alias `@/`** (no relativos). Un test en `tests/lib/potions/random.test.ts` importa `@/lib/potions/random`, no `../../../lib/potions/random`. Evita dependencia con la profundidad del árbol de tests y reduce errores al mover.
- **Ubicación espejo**: el test de `lib/potions/random.ts` vive en `tests/lib/potions/random.test.ts` (mismo path relativo, prefijado con `tests/`). Mantiene el mapeo mental 1:1 con el archivo bajo test.
- **Config**: `vitest.config.ts` `include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"]`. `setupFiles: ["./tests/setup.ts"]` (sin cambios).

## Alternativas consideradas

| Alternativa | Por qué se descarta |
|---|---|
| **Mantener co-locación (ADR-0012 original)** | El usuario quiere src limpio de tests. Decisión explícita que revierte la convención previa. |
| **`__tests__/` por paquete** (subdirectorio dentro de cada carpeta de src) | Conserva localidad y reduce drift, pero los tests siguen "dentro" del árbol de src — no cumple el requisito de "otra folder distinta". |
| **`src/` + `tests/` con todo el src bajo `src/`** | Next.js App Router exige `app/` en la raíz (o bajo `src/app` con config extra). Migrar todo a `src/` es un cambio innecesariamente grande y rompe convenciones de Next.js. |
| **Arbol paralelo con imports relativos** (sin alias `@/`) | Imports largos y frágiles a la profundidad. Los alias `@/` los hacen estables. |

## Consecuencias

- **Positivas:**
  - Las carpetas de src contienen exclusivamente implementación — navegación y revisión más limpias.
  - Un solo lugar (`tests/`) para todo el suite; el "tests/setup.ts" ya convivía ahí.
  - Imports `@/` en tests son estables ante moves de tests dentro de `tests/`.
  - Mapeo mental 1:1 (mismo subpath bajo `tests/`) preserva la localidad conceptual de ADR-0012.
- **Negativas:**
  - **Riesgo de drift**: al renombrar/mover un archivo de src, su test espejo puede quedar huérfano (no detectable por el import directo como en co-locación). Mitigación: mantener el mapeo 1:1 estricto; revisión en PR atenta a moves de src sin moves de tests.
  - Imports `@/` requieren que los aliases de vitest estén siempre configurados (ya lo están).
  - Migración one-shot de 20 archivos (este PR).
- **Riesgos / mitigaciones:**
  - **Olvido del alias en un test nuevo**: si alguien escribe un import relativo, funcionará mientras el test esté en `tests/` apuntando a otro test, pero apuntar a src con relativo es frágil. Mitigación: lint/PR review; no se agrega regla custom en v1.
  - **Renumbering futuro**: si src se reorganiza, el espejo `tests/` debe acompañar. Aceptado como costo del layout separado.
- **Acciones derivadas:**
  - `git mv` de los 20 tests existentes a `tests/` (rename detectado por git, preserva historia).
  - Reescritura de imports relativos → `@/` (28 imports).
  - `vitest.config.ts` `include` → `tests/**`.
  - ADR-0012 §"Estructura de tests" queda **reemplazado** por este ADR; el resto de ADR-0012 (tooling, TDD, gates) se mantiene vigente.

## Notas

- La co-locación (ADR-0012 original) sigue siendo una convención válida y común; este ADR no la desestima globalmente, solo elige la separación para este proyecto por preferencia del equipo.
- Drift risk reference: por eso muchos equipos volvieron a co-locación; aquí se mitiga con mapeo 1:1 estricto y reviews.
