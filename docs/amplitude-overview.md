# Amplitude — overview para wizard-hub

Documento de referencia (y para la fase de presentación). Qué es Amplitude, cómo
funciona en general, qué hace el proyecto hoy y qué podría hacer.

---

## 1. ¿Qué es Amplitude?

Amplitude es una plataforma de **product analytics**: registra lo que hacen los
usuari**os** dentro de la app (eventos) y te deja analizar ese flujo para entender
comportamiento, medir conversiones y tomar decisiones de producto.

La diferencia clave vs. herramientas de **web analytics** (Google Analytics,
Plausible): Amplitude se piensa **centrado en usuario y en el journey**, no en
pageviews. Responde preguntas como *"¿cuántos usuarios que vieron una casa
terminaron uniéndose al fanclub?"* o *"¿en qué paso del funnel se caen?"*, con
segmentación por propiedades del usuario y del dispositivo.

El modelo de negocio: hay plan **free** (el que usamos, suficiente para el
challenge) y planes pagos que desbloquean Session Replay, Experiment (A/B),
more data retention, etc.

---

## 2. ¿Cómo funciona en general?

Todo gira alrededor de **cinco conceptos**:

### Eventos (events)
Cosas que pasan y que querés medir. Cada evento tiene un **nombre** (ej.
`House Viewed`) y un **timestamp**. Dos tipos:

- **Automáticos:** el SDK captura cosas sin código extra. Nosotros activamos
  `pageViews` y `sessions` (carga de página + inicio/renovación de sesión).
- **Manuales (`track`):** los dispara la app con `track('House Viewed', {...})`.
  Son el grueso de nuestro catálogo.

### Propiedades de evento (event properties)
Metadata adjunta a un evento. En `House Viewed` mandamos `houseId`,
`houseName`, `houseFounder` y `source`. Sirven para **segmentar y agrupar** en
los dashboards (ej. totales de `House Viewed` agrupados por `source`).

### Propiedades de usuario (user properties)
Atributos del usuario, **persistentes** hasta que se cambian explícitamente. Se
setean vía la API `Identify`. Ej.: `favoriteHouse`, `wizardName`,
`lifecycleStage`. A diferencia de las event properties, **no viven en un evento
puntual** sino en el perfil del usuario, así podés segmentar cualquier evento por
*"usuarios cuya casa favorita es Slytherin"*.

### Identidad y sesiones
- **Identidad:** cada usuario tiene un `device_id` (auto, anónimo) y
  opcionalmente un `user_id` (cuando se conoce). Cuando un anónimo se identifica,
  Amplitude **mergea** su histórico anónimo con el perfil conocido → no perdés el
  recorrido previo. Es el núcleo del lifecycle *anónimo → conocido*.
- **Sesiones:**ventana de actividad (default ~30 min de inactividad la cierra).
  El SDK las detecta solo; habilita métricas de sesiones activas, duración, etc.

### Pipeline y SDK
Los eventos salen del browser vía SDK (`@amplitude/unified`), con **batching** y
**cola offline** (si no hay red, se encolan y mandan después). Llegan a los
servidores de Amplitude y se ven en el dashboard en segundos-minutos.

---

## 3. ¿Qué cosas se pueden hacer?

Capacidades de Amplitude (las que apply a un proyecto web como este):

| Capacidad | Qué responde |
|---|---|
| **Event Segmentation** | Frecuencia/totales/uniques de un evento, segmentado y agrupado por propiedades. |
| **Funnels** | Conversión entre pasos ordenados (ej. *viewed house → joined*). Dónde se caen. |
| **Retention** | Qué porcentaje vuelve al día/semana N (cohorts). |
| **User Paths** | Flujos reales de navegación (después de X, a dónde van). |
| **Cohorts / User composition** | Agrupar usuarios por propiedades o comportamiento y reutilizar el segmento. |
| **Stickiness** | DAU/WAU/MAU y frecuencia de uso. |
| **Real-time / Active users** | Users activos en vivo. |
| **Dashboards** | Charts guardados y compartidos (las 2 métricas del challenge viven acá). |
| **Session Replay** *(pago, opt-in)* | Grabación de video de la sesión para ver *dónde* se traban. |
| **Experiment** *(pago)* | A/B testing y feature flags atados a métricas. |
| **Data (export / Cohort sync / CDP)** | Exportar a warehouse o sincronizar cohorts a otras tools. |

---

## 4. ¿Qué cosas estamos haciendo (wizard-hub)?

### Integración (ADRs 0006 + 0017)
- **SDK:** `@amplitude/unified`, inicializado con `initAll` **una sola vez** en un
  Client Component del root layout (`advanced-init-once`), diferido post-hidratación
  para no penalizar LCP.
- **Wrapper propio tipado** en `lib/analytics/` (`client.ts`, `events.ts`,
  `index.ts`). Los componentes **nunca** importan el SDK directo: consumen una
  surface tipada (`trackHouseViewed(...)`, `identifyFanclubMember(...)`, etc.).
  El catálogo en `events.ts` (`EventCatalog`) es la **única fuente de verdad** y
  TypeScript garantiza que no se mande un evento mal nombrado ni con props
  incorrectas. Cambiar de vendor → tocar 1 archivo.
- **Autocapture selectivo:** solo `pageViews` + `sessions`. El resto manual
  (catálogo finito y deliberado, no captura indiscriminada de clicks/forms).
- **`platform` automática en TODOS los eventos** (`web-desktop | web-mobile |
  web-tablet`) inyectada por el wrapper (ADR-0019). En SSR se omite en vez de
  mandar `null`. Esto habilita la métrica "by Platform" sin esfuerzo por evento.
- **Kill-switch por env:** `NEXT_PUBLIC_AMPLITUDE_ENABLED=false` desactiva todo
  (local, tests, CI sin API key).
- **Session Replay opt-in** vía `NEXT_PUBLIC_AMPLITUDE_SESSION_REPLAY=true`
  (default off: es pago y graba video → privacidad).

### User lifecycle (ADR-0008)
```
[anónimo]  device_id auto · lifecycleStage='anonymous'
    │  completa "Únete al fanclub" (email + wizardName + favoriteHouse)
    ▼
[conocido] setUserId(email) · user props: wizardName, favoriteHouse, lifecycleStage='known'
           Amplitude mergea el histórico anónimo.
```
No hay auth real; el email actúa de stable identifier (login futuro).

### Catálogo de eventos (ADRs 0007 v1.0 + 0018 v1.1 + 0025 v1.2 + 0028 v1.3)

| Evento | Props clave | Para qué |
|---|---|---|
| `Page Viewed` *(auto)* | `path`, `title`, `referrer` | tráfico general |
| `House Viewed` | `houseId`, `houseName`, `houseFounder`, `source` | **Métrica 1 del challenge** |
| `House Card Clicked` | `houseId`, `houseName`, `source` | interacción |
| `Explore CTA Clicked` | `location` (`hero`/`nav`/`footer`/`house_detail`) | interacción |
| `Back To Houses Clicked` | `fromHouseId` | navegación |
| `Theme Toggled` | `newTheme` | preferencia |
| `Fanclub Joined` *(v1.1)* | `favoriteHouse`, `wizardNameLength` | conversión + identificación |
| `Potion Game Started` *(v1.2)* | `potionId`, `potionName`, `recipeSize` | engagement |
| `Potion Round Played` | `potionId`, `round`, `cardIndex`, `correct` | dificultad |
| `Potion Game Won` / `Lost` | `potionId`, `roundsCompleted`/`round`, `durationSec`, `failedCardIndex` | outcome + dificultad |
| `Potion Game Restarted` | `previousPotionId`, `previousOutcome` | retención in-session |
| `Wizard Search Submitted` *(v1.3)* | `queryLength`, `resultCount`, `fuzzyThreshold` | tuning de fuzzy |
| `Wizard Result Clicked` | `wizardId`, `wizardName`, `resultRank`, `queryLength` | **señal de intención + tuning** |
| `List Scroll Depth` | `listName`, `maxScrollPercent`, `timeOnPageSec` | profundidad de browse |

Convenciones: eventos `Title Case` verbo en pasado, props `camelCase`, enums en
`snake_case`, **sin PII** en eventos (mandamos `queryLength`/`wizardNameLength`,
nunca el texto/nombre).

### Las 2 métricas obligatorias del challenge (dashboard)
1. **Most viewed House (Unique Users)** — `House Viewed` agrupado por `houseName`,
   métrica *unique users*.
2. **All Houses Viewed by Platform (Event Totals)** — `House Viewed` totales
   agrupados por la property `platform`.

### Decisiones de privacidad deliberadas
- No se manda texto de búsqueda ni nombres ingresados (solo longitudes).
- Session Replay off por defecto.
- Email como `user_id` pero no como event property.

---

## 5. ¿Qué cosas podríamos hacer?

Ordenado de "casi gratis, ya tenemos los datos" a "requiere plan/trabajo nuevo".

### Ya habilitado por nuestra instrumentación (sólo construir en el dashboard)
- **Funnel de onboarding:** `Explore CTA Clicked` → `Fanclub Joined` → `House
  Viewed` post-join. Muestra dónde se caen los nuevos. *(ADR-0007 "análisis
  futuros" #1; armaría faltando un `Join Form Viewed` para el paso intermedio.)*
- **Cross-favorite house:** `Wizard Result Clicked` particionado por la user
  property `favoriteHouse` — *"¿los fans de Slytherin buscan otros magos que los
  de Gryffindor?"*. *(ADR-0007 #2 — requiere lifecycle conocido.)*
- **Fuzzy tuning loop:** correlación `resultRank` (de `Wizard Result Clicked`) ↔
  `maxScrollPercent` (`List Scroll Depth`) para ajustar `fuzzyThreshold`
  data-driven. Es el *showcase* "Amplitude alimenta una decisión de ingeniería"
  (ADR-0028). Caveat: con 17 magos y tráfico del challenge **no dará poder
  estadístico**, pero el **modelo** es lo defendible en la presentación.
- **Dificultad del potion game:** `Potion Round Played.correct` + `Potion Game
  Lost.failedCardIndex` → qué rondas/pociones son más difíciles → balancear.
- **Engagement del potion game:** `Started` vs `Won`/`Lost` vs `Restarted` →
  retención in-session y win rate.

### Con el plan actual, armando más charts
- **Retention** de fanclub members (vuelven al día/semana N tras unirse).
- **Stickiness** DAU/WAU por `platform` o `favoriteHouse`.
- **User paths** desde `/` (a dónde van primero: houses, potions, wizards).

### Requeriría instrumentación adicional (events nuevos → bump de taxonomy)
- **`Join Form Viewed`** + **`Join Form Submitted`** + error states → funnel de
  unión completo y drop-off por campo (v3 de taxonomy).
- **`Potion Game Abandoned`** (salir sin terminar) → distingue *lost* de *abandonó*.
- **Tiempo en página** como event property o métrica derivada.
- **Scroll/depth en houses** (no sólo wizards).

### Requeriría plan/feature de Amplitude
- **Session Replay** (pago): ya está cableado opt-in por env var. Prenderlo para
  el demo de presentación mostraría grabaciones de usuarios reales cayendo en
  pasos confusos — muy fuerte para defender UX.
- **Experiment / A/B** (pago): testear hipótesis (ej. threshold de fuzzy A vs B,
  copys de CTA) medido contra métricas.
- **Cohort sync** a una herramienta de email/CRM para activar miembros del
  fanclub.

### Higiene / gobernanza (no es feature, es cuidado)
- **Tracking plan** en Amplitude (definir los eventos en el admin) para que lo
  que manda el código y lo que espera el dashboard coincidan — hoy el catálogo
  vive sólo en `events.ts`.
- **Data cleanup:** blocking/merging de eventos mal escritos si la taxonomy
  muta (en este challenge la taxonomy es finita y tipada → riesgo bajo).
- **Consentimiento/cookie banner:** hoy no pedimos consent explícito; si el
  challenge/presentación lo requiere, conviene mencionar el trade-off (Session
  Replay off por defecto ya es un gesto en esa dirección).

---

## Referencias
- ADRs: 0006 (wrapper), 0007 (taxonomy), 0008 (lifecycle), 0017 (unified),
  0019 (`platform`), 0018 (`Fanclub Joined`), 0025 (potions events), 0028
  (wizard search).
- Código: `lib/analytics/` (`client.ts`, `events.ts`, `index.ts`, `platform.ts`).
- Docs Amplitude: https://amplitude.com/docs/analytics/browser-sdk y
  https://amplitude.com/docs/framework-integrations/nextjs-installation
