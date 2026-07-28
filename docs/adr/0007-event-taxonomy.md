# ADR-0007: Taxonomía de eventos de Amplitude

- **Estado:** Aceptado
- **Fecha:** 2026-07-27
- **Decisor(es):** kerty + arquitecto
- **Relacionado:** ADR-0006 (wrapper), ADR-0008 (user lifecycle), ADR-0019 (`platform` event property), AMP-002

## Contexto
Necesitamos un catálogo de eventos y propiedades que:

1. **Soporte las 2 métricas obligatorias del challenge:**
   - *Most viewed House (Unique Users)*.
   - *All Houses Viewed by Platform (Event Totals)*.
2. **Cubra ≥5 eventos de interacción** adicionales al page view.
3. **Habilita análisis futuros** identificados en sesiones de diseño (ver §"Análisis futuros").
4. Sea consistente y presentable (defender taxonomy en la presentación).

## Decisión

### Convenciones
- **Eventos:** `Title Case`, verbo en pasado (`House Viewed`, no `view_house` ni `ViewHouse`).
- **Propiedades de evento:** `camelCase`, ASCII, sin PII en nombres de props.
- **Propiedades de usuario:** `camelCase`, persistentes hasta modificación explícita.
- **Booleanos:** prefix `is` o `has` (`isAnonymous`, `hasAccount`).
- **Enums:** valores en `snake_case` para legibilidad en dashboards (`source: 'home'`).

### Propiedad común a todos los eventos: `platform`

ADR-0019 precisa que **todos** los eventos del catálogo (v1 y futuros) llevan automáticamente la propiedad `platform` (`'web-desktop' | 'web-mobile' | 'web-tablet'`), adjuntada por el wrapper sin que los call sites lo hagan explícito. En SSR se omite la property en lugar de enviar `null`.

Esto habilita la métrica del challenge "All Houses Viewed by Platform" sobre `House Viewed` y, de paso, cualquier segmentación cross-evento por device.

### Catálogo v1 (minimal — Houses)

| Evento | Cuándo | Props | Soporta |
|---|---|---|---|
| `Page Viewed` | Auto vía SDK `defaultTracking.pageViews: true` | `path`, `title`, `referrer` (auto) | **Métrica 2** (vía `House Viewed` también) |
| `House Viewed` | Entrada a `/houses/[id]` | `houseId`, `houseName`, `houseFounder`, `source` (`'list' \| 'home' \| 'direct'`) | **Métrica 1** |
| `House Card Clicked` | Click en card de casa | `houseId`, `houseName`, `source` (`'home' \| 'houses_list'`) | interacción |
| `Explore CTA Clicked` | Click en CTA "explorar" | `location` (`'hero' \| 'nav' \| 'footer'`) | interacción |
| `Back To Houses Clicked` | Click en "volver" desde detalle | `fromHouseId` | interacción |
| `External Link Clicked` | Click en link externo | `target`, `location` | interacción |
| `Theme Toggled` | Toggle dark/light | `newTheme` (`'dark' \| 'light'`) | interacción |

**Total v1:** 1 evento automático + 6 de interacción (mínimo del challenge era 5) ✅.

### Catálogo v2 (futuro — Wizards + Search)

| Evento | Props | Soporta |
|---|---|---|
| `Wizard Search Submitted` | `queryLength`, `resultCount`, `fuzzyThreshold` | análisis de fuzzy |
| `Wizard Result Clicked` | `wizardId`, `wizardName`, `resultRank`, `queryLength` | análisis de fuzzy + cross-favorite house |
| `List Scroll Depth` | `listName`, `maxScrollPercent`, `timeOnPageSec` | análisis de fuzzy (periodic event o edge-triggered al 25/50/75/100%) |

**Nota sobre v2:** se incorpora cuando `/wizards` + Fuse.js entre en scope (ver ADR futuro `search-v2-fuzzy`). No se implementan events sin consumidor real.

### Propiedades de usuario

| Prop | Tipo | Cuándo se setea |
|---|---|---|
| `lifecycleStage` | `'anonymous' \| 'known'` | init = anonymous; al unirse al fanclub = known |
| `wizardName` | string | al unirse (display name elegido por el usuario) |
| `favoriteHouse` | `'gryffindor' \| 'slytherin' \| 'ravenclaw' \| 'hufflepuff'` | al unirse |
| `preferredTheme` | `'dark' \| 'light'` | al toggle, persistente |

### Métrica 1 — Most viewed House (UU)

- Evento: `House Viewed`.
- Dimensión: `houseName` (o `houseId`).
- Métrica: Unique Users (cuenta `device_id`/`user_id` distintos).
- Filtro opcional: `source != 'direct'` para excluir deep links.

### Métrica 2 — "All Houses" Viewed by Platform (Event Totals)

- Evento: `House Viewed` (principal) o `Page Viewed` con `path = '/houses'` (secundario).
- Dimensión: `platform` (propiedad común a todos los eventos — ver ADR-0019).
- Métrica: Event Totals.

`platform` se calcula en el wrapper basándose en `navigator.userAgent` (con `window.innerWidth` reservado para futuros ajustes). SSR-safe: en server se omite la property. Ver ADR-0019 para el mecanismo completo y el manejo de usuarios anónimos.

## Análisis futuros (no implementan events extra ahora — solo documentación)

Estas métricas se construyen en el dashboard Amplitude con los events v1+v2 una vez disponibles:

1. **Funnel de unión al fanclub:** `Explore CTA Clicked` → `Join Form Viewed` (v3) → `Fanclub Joined` (v3) → `House Viewed` post-join.
2. **Cross-favorite house:** `Wizard Result Clicked` particionado por user property `favoriteHouse`. *(requiere v2)*
3. **Fuzzy tuning insights:** correlación entre `resultRank` del click y `maxScrollPercent` para ajustar `fuzzyThreshold`. *(requiere v2 — ver discusión ADR search-v2 futuro)*

## Consecuencias
- **Positivas:**
  - Cobertura completa de requisitos del challenge con margen.
  - Catálogo finito y versionado → presentable.
  - Habilita análisis futuros sin rediseño del modelo.
- **Negativas / Riesgos:**
  - Si se agregan eventos al azar sin actualizar este ADR → ruina la taxonomía. Mitigación: el wrapper `lib/analytics/events.ts` es la única puerta, y no compila si el evento no está en el catálogo.
  - Riesgo de PII en `wizardName` (display name elegido por usuario). Mitigación: sanitización + longitud máxima.
- **Acciones derivadas:**
  - Crear `lib/analytics/events.ts` con tipos derivados del catálogo de este ADR.
  - Crear plan en Amplitude (Data, govern) con el mismo catálogo para tracking de bloqueos.

## Notas
- Referencias: Amplitude Data Planning Playbook (https://amplitude.com/docs/data/data-planning-playbook), sección "Naming Conventions".
- Eventos v2 sujetos a ADR futuro `NNNN-search-v2-fuzzy`.
