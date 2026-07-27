# ADR-0017: Migración a `@amplitude/unified` (reemplaza parte de ADR-0006)

- **Estado:** Aceptado
- **Fecha:** 2026-07-27
- **Decisor(es):** kerty + arquitecto
- **Reemplaza:** §"Decisión" de [ADR-0006](./0006-amplitude-wrapper-tipado.md) (la elección del paquete `@amplitude/analytics-browser`)
- **Mantiene:** toda la arquitectura del wrapper tipado definida en ADR-0006 (carpetas `lib/analytics/`, surface pública tipada, reglas de capas). Solo cambia el paquete subyacente.

## Contexto
Durante la implementación de PR `feat/001-analytics-and-theme-bootstrap` descubrimos que:

1. El bot oficial de instalación de Amplitude recomienda hoy **`@amplitude/unified`** con `initAll(apiKey, options)`, no `@amplitude/analytics-browser` con `init(...)`.
2. `@amplitude/unified` es un meta-paquete oficial que re-exporta todo de `@amplitude/analytics-browser` y suma Session Replay + Experiment en una sola inicialización.
3. La forma de opciones cambió: en lugar de `{ defaultTracking: {...} }` ahora es `{ analytics: { defaultTracking: {...} }, sessionReplay: {...} }` (nested por SDK).
4. El asistente de Amplitude cita `initAll` como la entrada canónica actual.

ADR-0006 decidió el wrapper propio tipado **sobre** `@amplitude/analytics-browser`. La arquitectura del wrapper sigue siendo correcta; solo el paquete subyacente cambia.

## Decisión
**Migrar el wrapper de `@amplitude/analytics-browser` a `@amplitude/unified`.**

Cambios concretos:
- `import * as amplitude from "@amplitude/unified"` (antes: `@amplitude/analytics-browser`).
- `amplitude.initAll(apiKey, options)` (antes: `amplitude.init(...)`).
- Estructura de opciones: `{ analytics: {...}, sessionReplay: {...?} }`.
- **Session Replay es opt-in** vía env var `NEXT_PUBLIC_AMPLITUDE_SESSION_REPLAY=true` (default `false`). Razones:
  - Es feature paga de Amplitude.
  - Graba video de la sesión del usuario → considerations de privacidad.
  - Default seguro: si alguien clona el repo, no graba nada hasta que lo decida explícitamente.

Todo lo demás del wrapper (`lib/analytics/index.ts`, `events.ts`, tipos `EventCatalog`, surface `trackHouseViewed` etc., identidad `setUserId`/`Identify`/`reset`) **se mantiene idéntico** — el meta-paquete re-exporta la misma API de analytics.

## Alternativas consideradas
| Alternativa | Por qué se descarta |
|---|---|
| **Quedarse en `@amplitude/analytics-browser`** | Funciona, pero ya no es el paquete canónico que recomienda Amplitude. Mantenerse en él nos aleja de la documentación oficial. |
| **Usar `initAll` con autocapture total (`autocapture: true`)** | Captura todos los clicks/forms/changes indiscriminadamente. Traiciona ADR-0007 (catálogo finito y tipado). Queda explícito: solo pageViews + sessions automáticos; el resto manual. |
| **Session Replay siempre on (`sampleRate: 1`)** | Como recomienda el bot. Pero: paga, graba usuarios sin consentimiento explícito, ensucia el bundle. Default off, opt-in por env. |

## Consecuencias
- **Positivas:**
  - Un solo paquete oficial, alineado con la documentación actual.
  - Opción de habilitar Session Replay para el demo de presentación si queremos (toggle env var + redeploy).
  - API del wrapper se mantiene estable → componentes y use cases no se enteran del cambio.
- **Negativas:**
  - `@amplitude/unified` es más pesado en KB que el browser-only (incluye plugins aunque no se usen).
  - Session Replay necesita aceptación en Términos de Amplitude antes de usarse en producción.
- **Acciones derivadas:**
  - `package.json`: remover `@amplitude/analytics-browser`, agregar `@amplitude/unified`.
  - `lib/config/env.ts`: agregar `sessionReplayEnabled` flag.
  - `.env.example`: documentar `NEXT_PUBLIC_AMPLITUDE_SESSION_REPLAY=false` (default).
  - Si se habilita Session Replay en el futuro, escribir ADR específico (privacidad + costo).

## Notas
- Docs del paquete: https://amplitude.com/docs/sdks/analytics/browser/browser-sdk-2
- `initAll` source: `node_modules/@amplitude/unified/lib/esm/unified.d.ts` (UnifiedClient interface).
- ADR-0007 (event taxonomy) y ADR-0008 (user lifecycle) **no se ven afectados** — la API de `track`/`identify`/`setUserId` es idéntica entre los dos paquetes.
