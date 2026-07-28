# ADR-0019: Implementación de `platform` — event property en wrapper (precisa ADR-0007)

- **Estado:** Aceptado
- **Fecha:** 2026-07-28
- **Decisor(es):** kerty + arquitecto
- **Precisa:** [ADR-0007](./0007-event-taxonomy.md) §"Métrica 2 — All Houses Viewed by Platform"
- **Relacionado:** [ADR-0006](./0006-amplitude-wrapper-tipado.md) (wrapper tipado), [ADR-0017](./0017-migracion-amplitude-unified.md) (SDK unificado), [ADR-0008](./0008-user-lifecycle.md) (user lifecycle — manejo de anónimos)

## Contexto

ADR-0007 ya declaraba `platform` como propiedad del evento `Page Viewed`:

> `platform` se setea al inicializar el wrapper, basándose en `navigator.userAgent` + `window.innerWidth`. Se envía como prop en todos los `Page Viewed`.

Sin embargo, faltan precisar tres puntos que aparecieron al implementar:

1. **Usuarios anónimos.** El modelo de user lifecycle (ADR-0008) tiene un estado `anonymous` antes del formulario "Únete al fanclub". Si `platform` viviera como **user property**, su valor dependería del momento en que se llama `identify()` y de si el primer `track()` sale antes o después. Con SSR + first paint hay race conditions reales.
2. **Alcance.** ADR-0007 lo ataba solo a `Page Viewed`. Pero la métrica "All Houses Viewed by Platform" usa `House Viewed` (que es la que el challenge pide explícitamente como *Houses Viewed by Platform*). Conviene adjuntarla a **todos** los eventos.
3. **SSR safety.** `navigator` y `window` no existen en el servidor. El wrapper se inicializa en client, pero el tipo del helper debe estar libre de `ReferenceError`.

## Decisión

**`platform` es una event property, adjuntada automáticamente por el wrapper a TODOS los `track()`**, calculada una sola vez (lazy memo) en el primer uso client-side.

### Valores canónicos

```ts
type Platform = "web-desktop" | "web-mobile" | "web-tablet";
```

Mantener los valores definidos en ADR-0007 §"Métrica 2" para no romper consistencia.

### Cálculo

Heurística basada en `navigator.userAgent` + `window.innerWidth`:

- **Tablet** (`web-tablet`): UA contiene `iPad|Android(?!.*Mobile)|Silk|PlayBook|Kindle` **o** `innerWidth >= 768 && UA tiene touch`.
- **Mobile** (`web-mobile`): UA contiene `Mobi|iPhone|Android(?!.*Mobile)` (cualquier Mobi/Android Mobile) **o** `innerWidth < 768 && UA tiene touch`.
- **Desktop** (`web-desktop`): default.

### SSR safety

El helper `computePlatform()`:
- Si `typeof navigator === "undefined"` → retorna `null`.
- Si retorna `null`, el wrapper **omite** la property en ese evento (no envía `platform: null`).
- En client, el wrapper memoiza el resultado tras la primera llamada efectiva.

### Punto de inyección

El wrapper existente en `lib/analytics/` (ADR-0006/0017) intercepta cada `track()` y adjunta `platform` al payload antes de delegar al SDK. **Cero cambios en call sites** (`house-viewed-tracker.tsx`, `join-form.tsx`, etc. siguen iguales).

### Qué hace cada call site

Nada. La property es transparente. Esto preserva la regla DRY-with-judgment (AGENTS.md §2.7): hay un único consumidor real (la métrica 2) y un único punto de cómputo (el wrapper), por lo que no se abstrae más allá.

## Alternativas consideradas

| Alternativa | Por qué se descarta |
|---|---|
| **A. User property global vía `identify()` al init** | Race condition: el primer `Page Viewed` puede dispararse antes del `identify` (especialmente con `defaultTracking.pageViews: true` que el SDK emite en init). Ese evento queda sin `platform`. |
| **C. Ambas (user property + event property)** | Duplicación. La user property no aporta nada si la event property siempre está presente. Viola "no abstraer por abstraer" (AGENTS.md §2.6). |
| **Field nativo `platform` del SDK** | En `@amplitude/analytics-browser`, el campo `platform` del evento es **siempre `"Web"`** para una web app. No permite distinguir Desktop/Mobile/Tablet. La métrica sería trivial (un solo valor). |
| **Solo en `Page Viewed` (literal ADR-0007)** | La métrica del challenge es "Houses Viewed by Platform" → necesita `House Viewed`, no `Page Viewed`. Además, tener `platform` en todos los eventos habilita análisis cross-evento futuros (funnels por device) sin re-instrumentar. |

## Consecuencias

- **Positivas:**
  - Resuelve el caso anónimo **por diseño**: la property viaja con el evento, no depende del perfil ni del ordering.
  - Un solo punto de mantenimiento (`lib/analytics/`).
  - Habilita segmentación por device en **cualquier** evento futuro sin tocar el catálogo (ADR-0007 v2/v3).
  - Cumple requirement del challenge "All Houses Viewed by Platform (Event Totals)".
- **Negativas:**
  - La property vive en cada evento (mayor volumen en payload). Mitigación: son ~14 bytes/evento extra; despreciable.
  - Heurística UA puede errar en edge cases (ej. tablets en modo desktop, foldables). Mitigación: documentar y aceptar; el challenge no requiere granularidad fina.
- **Riesgos / mitigaciones:**
  - **UA fingerprinting drift:** navegadores deprecando UA client hints. Mitigación: si `navigator.userAgentData` está disponible en el futuro, migrar el helper (no rompe call sites).
  - **SSR leaks:** si algún `track()` se llama en server por error, no crashea — solo omite la property.
- **Acciones derivadas:**
  - Crear `lib/analytics/platform.ts` con `computePlatform()` (TDD: degenerate SSR → mobile UA → desktop UA → tablet UA → edge cases).
  - El wrapper adjunta `platform` en cada `track()`.
  - Actualizar `EventCatalog` type: `platform` pasa a ser **propiedad común** a todos los eventos (no se lista individualmente en cada evento del catálogo).
  - Actualizar ADR-0007 tabla v1: aclarar que `platform` es común a todos los eventos, no solo `Page Viewed`. *(se hace en el mismo PR feat/007).*

## Notas

- Esta es una **precisión** de ADR-0007, no un reemplazo. La semántica de `platform` y sus valores no cambian; solo se aclara el mecanismo de inyección (event property global vía wrapper) y el manejo de usuarios anónimos.
- Inspiración: [Amplitude docs — User & Event Properties](https://amplitude.com/docs/data/user-properties-and-event-properties), sección "When to use each".
- La heurística UA sigue lineamientos de MDN [`navigator.userAgentData`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/userAgentData) para futura migración.
