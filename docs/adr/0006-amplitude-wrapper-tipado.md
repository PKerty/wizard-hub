# ADR-0006: Integración de Amplitude — wrapper propio tipado

- **Estado:** Aceptado
- **Fecha:** 2026-07-27
- **Decisor(es):** kerty + arquitecto
- **Relacionado:** ADR-0003 (TypeScript), AMP-001, AMP-002, AMP-003

## Contexto
El challenge exige instrumentar Amplitude (page views + ≥5 eventos de interacción). Necesitamos decidir la **forma** de integración entre el código de la app y el SDK de Amplitude, considerando:

- Acoplamiento al vendor (cambiar de tool en el futuro).
- Seguridad de tipos (ADR-0003 exige TS strict).
- Mantenibilidad al crecer el número de eventos.
- Trazabilidad para la presentación.

## Decisión
Usar el **SDK oficial `@amplitude/analytics-browser`** envuelto en un **wrapper propio delgado y tipado** en `lib/analytics/`.

Estructura:
- `lib/analytics/client.ts` — inicializa el SDK con config central (API key, `defaultTracking.pageViews: true`, autocapture selectivo).
- `lib/analytics/events.ts` — un único mapa de eventos con tipos (event name + shape de props). Tipos exported para uso desde componentes.
- `lib/analytics/index.ts` — API pública: `analytics.trackHouseViewed(...)`, `analytics.identifyFanclubMember(...)`, etc. Solo esta superficie se consume desde componentes.

Componentes y páginas NUNCA importan `@amplitude/analytics-browser` directamente.

## Alternativas consideradas
| Alternativa | Por qué se descarta |
|---|---|
| **SDK directo en componentes** | Acoplamiento total al vendor. Renombrar un evento implica grep por toda la codebase. Imposible tipar props sin duplicar. |
| **Analytics-agnostic (Segment / RudderStack)** | Overkill: añade costo, configuración y un vendor más para un scope donde solo se usa Amplitude. |
| **Custom tracking HTTP** | Reinventa la rueda (cola offline, batching, identidad, sessions). Descartado. |

## Consecuencias
- **Positivas:**
  - Cambiar de vendor (Mixpanel, PostHug) → tocar 1 archivo (`client.ts`).
  - TS garantiza que no se mande un evento mal nombrado o con props incorrectas — el catálogo es la única fuente de verdad.
  - Surface de API explícita → fácil de onboarding y de presentar.
- **Negativas:**
  - Boilerplate inicial (3 archivos + types). Aceptable por el valor defensivo en la presentación.
  - Mantener el catálogo syncronizado con la app requiere disciplina.
- **Mitigaciones:**
  - Tests unitarios sobre `events.ts` que verifiquen que cada evento del catálogo tiene su wrapper.
  - Lint rule que prohíba `import ... from '@amplitude/analytics-browser'` fuera de `lib/analytics/`.

## Notas
- Doc del SDK: https://amplitude.com/docs/analytics/browser-sdk
- Next.js integration guide: https://amplitude.com/docs/framework-integrations/nextjs-installation
- Reglas aplicables de la skill `vercel-react-best-practices`: `bundle-defer-third-party` (cargar el SDK con baja prioridad para no penalizar LCP), `advanced-init-once` (inicializar Amplitude una sola vez por carga de app).
