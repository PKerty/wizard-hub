# ADR-0031: Plataforma/dispositivo — usar las device properties nativas de Amplitude (reemplaza ADR-0019)

- **Estado:** Aceptado
- **Fecha:** 2026-07-30
- **Decisor(es):** kerty + arquitecto
- **Reemplaza:** [ADR-0019](./0019-propiedad-platform-event-property.md)
- **Relacionado:** [ADR-0006](./0006-amplitude-wrapper-tipado.md), [ADR-0007](./0007-event-taxonomy.md) §"Métrica 2"

## Contexto

ADR-0019 decidió computar `platform` nosotros mismos (heurística sobre
`navigator.userAgent` + `innerWidth` → `web-desktop | web-mobile | web-tablet`)
e inyectarla como **event property** en cada `track()`, argumentando que el
campo `platform` nativo del SDK siempre es `"Web"` en una web app.

Al revisar la instrumentación para la presentación descubrimos que **eso era
verdad para el campo `platform`, pero no para el breakdown por dispositivo**:
Amplitude colecta y deriva automáticamente, server-side, propiedades de
dispositivo en **todos** los eventos — `Device Type`, `Device Family`, `OS`,
`Device Category` (esta última una derived property OOTB que vale
`Desktop | Mobile | Tablet | ...`). Confirmado empíricamente en este proyecto:
`[Amplitude] Device Category` ya existe y la usamos para la métrica 2 del
challenge (`Page /houses Viewed by Platform`).

En otras palabras: **la métrica "by Platform" la resuelve Amplitude sin que
nosotros mandemos nada.** La `platform` custom de ADR-0019 duplica esa
clasificación, con dos costos: código extra y un regex de UA propio que **se
pone stale** (cambios de UA-CH en Chrome, nuevos dispositivos) mientras Amplitude
mantiene su base. El argumento original "anonymous-safe, sin race con identify"
no justifica la custom: las device properties nativas **también** son
anonymous-safe (se derivan del UA del evento, no del `identify`).

Fuerza rectora: **KISS** (AGENTS.md §2.4) — no reinventar la rueda.

## Decisión

**Eliminar la computación/inyección custom de `platform` y confiar en las
device properties nativas de Amplitude** (`Device Type` / `[Amplitude] Device
Category`) para toda segmentación por dispositivo, incluida la métrica 2 del
challenge.

Cambios concretos:
- `lib/analytics/client.ts` (`sendEvent`) vuelve a ser passthrough:
  `amplitude.track(name, properties)` — sin adjuntar nada.
- Se elimina `lib/analytics/platform.ts` (`detectPlatform` / `computePlatform`)
  y sus tests (`tests/lib/analytics/platform.test.ts`,
  `tests/lib/analytics/client.test.ts`).
- `trackingOptions` **sin tocar**: el device tracking del SDK queda **on** por
  default (no lo desactivamos), así Amplitude sigue derivando `Device Type`/`OS`.

## Alternativas consideradas

| Alternativa | Por qué se descarta |
|---|---|
| **Mantener la `platform` custom (ADR-0019)** | Redundante con `Device Type`/`Device Category`; regex propio con riesgo de stale; más código. |
| **Híbrido (mandar custom + usar la nativa)** | Duplicación de dimensiones para el mismo dato; confusión en dashboards (¿cuál usar?). Viola KISS. |

## Consecuencias

- **Positivas:**
  - Menos código y **cero mantenimiento de UA** — Amplitude actualiza su parser.
  - Una sola fuente de verdad para dispositivo (la de Amplitude), consistente
    entre eventos manuales y page-views.
  - La métrica 2 no se ve afectada (ya usaba `[Amplitude] Device Category`).
- **Negativas / trade-offs:**
  - Perdemos la taxonomía controlada (`web-desktop/mobile/tablet`) y la
    **portabilidad tool-agnostic** del valor (device detection es estándar entre
    tools, así que el costo real es bajo).
  - `Device Category` es una **user property** derivada (atribución por
    usuario/evento según Amplitude); para dispositivo — que rara vez cambia por
    usuario — es aceptable. Si en el futuro hicié falta atribución **estricta
    por evento**, se re-evalúa.
- **Reversibilidad:** la inyección vivía en un solo punto del wrapper
  (`sendEvent`); re-ponerla es trivial si el caso de uso lo justifica.

## Notas

- Docs Amplitude: Amplitude agrega automáticamente device properties a los
  eventos (`Device Type`, `Device Family`, `OS`, `Platform`, `Browser`...); se
  pueden desactivar con `trackingOptions` (las dejamos on).
- Histórico: los eventos previos conservan la property `platform` que enviábamos;
  los nuevos ya no la llevan (no rompe nada — la métrica usa Device Category).
