# ADR-0028: Búsqueda de magos con Fuse.js (search-v2-fuzzy)

- **Estado:** Aceptado
- **Fecha:** 2026-07-29
- **Decisor(es):** kerty + arquitecto
- **Relacionado:** ADR-0007 (extiende catálogo a v1.3), ADR-0005 (fetching SSG/ISR), ADR-0009 (estructura hexagonal), ADR-0022 (patrón de módulo)

## Contexto

ADR-0007 planificó una segunda iteración del producto (`/wizards` + búsqueda fuzzy) y dejó su instrumentación sujeta a *"ADR futuro `search-v2-fuzzy`"*. Este es ese ADR.

Fuerzas en juego:

- **Recurso:** la Wizard World API expone `/Wizards` con **17 magos** en total, cada uno `{ id, firstName, lastName, elixirs }`. Tanto `firstName` como `lastName` son **nullable** (hoy 3/17 tienen `firstName` null; asumimos que cualquiera de los dos —o ambos— puede faltar). No existe campo `house` en el recurso (el análisis *cross-favorite house* de ADR-0007 se hace contra la *user property* `favoriteHouse` del usuario que busca, no contra el mago).
- **Objetivo de producto:** una página `/wizards` donde el usuario encuentre magos por nombre tolerando typos.
- **Objetivo de showcase (presentación):** demostrar **fuzzy matching + ajuste data-driven del `fuzzyThreshold`** — un caso donde la telemetría alimenta una decisión de ingeniería. Es el uso más sofisticado de Amplitude del proyecto y un punto fuerte para la fase de presentación.
- **Honestidad sobre escala:** con 17 magos y tráfico del challenge, la correlación `resultRank`/scroll para tunear el threshold será **estadísticamente débil**. El modelo se documenta igual porque (a) la técnica es replicable a datasets mayores y (b) defender el *feedback loop* es lo valioso para un Solutions Architect, aunque los datos reales no concluyan un nuevo threshold.

## Decisión

1. **Librería:** **Fuse.js** (`fuse.js`). Ligera (~6 KB gzip), API simple, tuning fino (`threshold`, `distance`, `location`, `ignoreLocation`), es la canónica para fuzzy sobre datasets pequeños.
2. **Dónde se busca:** **cliente**. La página `/wizards` carga los 17 magos vía **SSG + ISR (`revalidate: 86400`, consistente con ADR-0005)** y Fuse.js busca en memoria → UX instantánea, sin round-trips. Con 17 items es trivial.
3. **Índice de búsqueda:** un único campo derivado, `displayName`, computado **defensivamente** asumiendo que `firstName` y `lastName` pueden ser ambos `null`:

   ```ts
   // lastName presente -> "firstName lastName" | lastName
   // solo firstName     -> firstName
   // ambos null/empty   -> null (no indexable)
   function buildDisplayName(firstName?: string | null, lastName?: string | null): string | null {
     const f = firstName?.trim() || null;
     const l = lastName?.trim() || null;
     if (f && l) return `${f} ${l}`;
     return f ?? l; // uno de los dos, o null
   }
   ```

   - Los magos con `displayName === null` **no se indexan** (no hay nombre buscable). No aparecen en resultados de búsqueda. En una eventual lista "todos los magos" se renderizarían con un label fallback (`Unnamed wizard`), pero esa vista está fuera del scope v1 de `/wizards`.
   - No se indexan `elixirs` (fuera de scope: se busca por nombre de mago, no por poción).
4. **`fuzzyThreshold` inicial: `0.3`** (rango Fuse 0 = exacto, 1 = todo). Tolerancia a 1-2 typos en nombres cortos. Es el valor que la telemetría ajustará.
5. **Módulo `modules/wizards`** hexagonal (dominio + aplicación + infraestructura), mimetizando ADR-0009/0022. El adapter mapea `WizardResponse` → entidad `Wizard { id, displayName: string | null }`. Los magos con `displayName === null` se conservan en el agregado (la lista completa los incluye) pero el caso de uso de búsqueda los filtra antes de construir el índice Fuse.
6. **Bundle:** Fuse.js se importa **estáticamente en el client component de `/wizards`** (no en el global). Al vivir solo en esa ruta, no afecta LCP de home/houses/potions. Si el bundle preocupara, se bajaría a `next/dynamic`, pero 6 KB en una sola ruta no lo justifican.
7. **Eventos v2 (extienden ADR-0007 → catálogo v1.3):**

   | Evento | Cuándo | Props |
   |---|---|---|
   | `Wizard Search Submitted` | submit del input de búsqueda | `queryLength`, `resultCount`, `fuzzyThreshold` |
   | `Wizard Result Clicked` | click en un resultado | `wizardId`, `wizardName`, `resultRank`, `queryLength` |
   | `List Scroll Depth` | al alcanzar 25/50/75/100 % del scroll de resultados | `listName`, `maxScrollPercent`, `timeOnPageSec` |

   - **Privacidad:** se envía **`queryLength`**, nunca `queryText`. La query del usuario puede contener cualquier cosa; sin el texto, la longitud basta para análisis de fuzzy sin exponer PII/intenciones.
   - **`List Scroll Depth`** es *edge-triggered* en los 4 umbrales (no periódico) para no inundar de eventos.

## Alternativas consideradas

- **MiniSearch / FlexSearch:** motores full-text más potentes y pesados. Innecesarios para 17 items; añaden complejidad sin beneficio.
- **Búsqueda server-side (API route):** round-trip injustificable con 17 items en memoria. Descartada.
- **Match exacto (sin fuzzy):** no tolera typos → peor UX y mata el showcase de tuning. Descartado.
- **`Intl.Segmenter` + indexOf:** reinventar fuzzy a mano es frágil y no suma valor demostrativo. Descartado.
- **Enviar `queryText` para análisis fino:** descartado por privacidad (ver §7).

## Modelo de feedback loop (el showcase analytics-driven)

Hipótesis de tuning, a validar con la telemetría:

- Si los usuarios **clickean consistentemente resultados de `resultRank` bajo (5-10)** y hay scroll profundo → el threshold es **demasiado estricto** (lo que buscan no aparece arriba) → subir `threshold` (más laxo).
- Si **siempre clickean rank 0-1** sin scroll → está bien ajustado o es **demasiado laxo** (mucho ruido arriba) → bajar `threshold`.
- La correlación `resultRank` ↔ `maxScrollPercent` es la señal principal.

**Importante:** con el volumen esperado (17 magos, tráfico del challenge), esta correlación **no será concluyente**. El ADR registra el *modelo* y la *técnica*; la conclusión numérica queda fuera del alcance del challenge y se documenta como trabajo futuro si el producto escala.

## Consecuencias

- **Positivas:**
  - Showcase sólido deFuse.js + analytics-driven para la presentación.
  - UX instantánea (client-side) y consistencia con los módulos existentes.
  - El catálogo pasa a v1.3 con 3 eventos que refuerzan la narrativa de "Amplitude alimenta decisiones".
- **Negativas / Riesgos:**
  - **+6 KB** en el bundle de `/wizards` (aceptable; mitigación en §6).
  - **Tuning aspiracional:** el feedback loop no concluirá un nuevo threshold con los datos del challenge. Riesgo de "parece que no usamos la data". *Mitigación:* en la presentación se enmarca como *modelo replicable*, no como conclusión cerrada.
  - `queryLength` no permite reconstruir términos buscados → análisis de *qué* buscan limitado. *Trade-off consciente* de privacidad.
- **Acciones derivadas (PRs):**
  1. `types/wizard-world.ts` — añadir `WizardResponse` / `WizardElixirResponse`.
  2. `modules/wizards` — dominio (`Wizard`), puerto, adapter (`wizardWorldWizardsRepository`), use case `getAllWizards`. ISR `revalidate: 86400`, `wizardWorldFetchSafe` con fallback `[]` (ADR-0026).
  3. `lib/wizards/search.ts` — fábrica del índice Fuse (`createWizardIndex` filtra `displayName === null`) + `searchWizards(query, threshold)`. Puro y testeable (TDD, ADR-0012). Incluir tests para los 3 casos degenerate del `displayName` (ambos null, solo uno, ambos presentes).
  4. `app/wizards/page.tsx` (RSC SSG) + `app/wizards/wizard-search.tsx` (client: input, lista, Fuse, tracking).
  5. `lib/analytics/events.ts` + `index.ts` — añadir los 3 eventos v1.3 (trackers tipados).
  6. Tracking plan de Amplitude (proyecto 845739) — planificar los 3 eventos nuevos.
  7. Nav/footer — añadir link `/wizards`.

## Notas

- Fuse.js docs: https://www.fusejs.io/
- Recurso API: `GET /Wizards` → 17 magos, `{ id, firstName (nullable), lastName (nullable), elixirs[] }`. Asumir que cualquiera de los dos nombres puede faltar (incluido ambos a la vez).
- El análisis *cross-favorite house* (ADR-0007 §"Análisis futuros" 2) opera sobre la **user property** `favoriteHouse` del buscador, no sobre el mago (la API no expone casa del mago).
