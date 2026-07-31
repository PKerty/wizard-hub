# Presentación — wizard-hub (Solutions Architect Challenge)

Paquete completo: **(1) Slides** · **(2) Guion de acción** (qué pasa en pantalla) ·
**(3) Speech** (qué decís) · **(4) FAQ** del jurado (énfasis Amplitude).

- **Duración objetivo:** ~18 min + Q&A.
- **Narrativa:** “decido, no improviso” — cada elección con alternativa + trade-off.
- **Artefactos reales:** dashboard `l5wszjy1`, deploy `wizard-hub.vercel.app`, repo
  `PKerty/wizard-hub`, ADRs `0001–0030`, diagramas en `docs/diagrams/`.

---

# Parte 1 — Slides (contenido por slide)

> Una idea por slide. Formato decisiones: **Decisión → Alternativa → Trade-off**.
> Los snippets son copia-pega del repo (reales).

### S0 — Título
- wizard-hub · fanclub de Harry Potter · guide para nuevos miembros.
- Solutions Architect Challenge — kerty.

### S1 — El challenge (problema + requisitos)
- Web app que consume la Wizard World API: `/Houses`, `/Houses/:id`.
- Instrumentar Amplitude: **todos los page views** + **≥5 eventos de interacción**.
- Entregables: HLD + LLD, repo GitHub, hosting (deseable), dashboard con 2 métricas.
- Fase 2: defender decisiones + intro de Amplitude.

### S2 — Solución en una mirada (HLD)
- **Visual:** Mermaid `docs/diagrams/hld.md` (Usuario → Vercel/Next → Wizard World API + Amplitude; módulos Houses/Potions/Wizards; ISR 86400s).
- Una imagen cuenta la arquitectura. Next.js App Router, SSG+ISR, 3 módulos hexagonales, wrapper de analytics.

### S3 — Decisión 1: Next.js + TypeScript strict (ADR-0002/0003)
- **Decisión:** Next.js App Router + TS strict.
- **Alternativa:** SSR frameworks / JS suelto.
- **Trade-off:** ecosistema + deploy trivial en Vercel + type safety **vs** lock-in razonable para el scope.

### S4 — Decisión 2: SSG + ISR (ADR-0005)
- **Decisión:** SSG home + ISR catálogo `revalidate: 86400` (24h).
- **Alternativa:** SSR/CSR puro.
- **Trade-off:** performance (HTML cacheado en edge) + **tolera que la API de Heroku se duerma** (ISR suaviza) **vs** datos con hasta 24h de retraso (irrelevante para canon de Hogwarts).

### S5 — Decisión 3: hexagonal/DDD por módulo (ADR-0009/0022/0028)
- **Decisión:** `modules/<context>/{domain,application,infrastructure}` con ports.
- **Alternativa:** estructura plana.
- **Trade-off:** separación de capas + **infra swappable** (el adapter de la API cambia sin tocar dominio) **vs** boilerplate en app chica → justificable como *showcase* de SA.
- **Visual:** árbol de carpetas (ver S6).

### S6 — Arquitectura del repo
```
app/                 # Next.js App Router (RSC)
modules/
  houses/{domain,application,infrastructure}/
  potions/...
  wizards/...
lib/
  analytics/         # wrapper (client · events · index · platform)
  potions/  wizards/  user/  api/
components/          # UI compartida
docs/  adr/  diagrams/
```
- Regla de imports: **domain no depende de afuera** (lint rule `import/no-restricted-paths`).

### S7 — Decisión 4: wrapper propio tipado sobre el SDK (ADR-0006/0017)
- **Decisión:** wrapper delgado en `lib/analytics/`; los componentes **nunca** importan el SDK.
- **Alternativas a Amplitude (lógica más allá de la demo):** PostHog, Mixpanel, o un CDP (Segment / RudderStack). Cambiar de tool = **tocar 1 archivo** (`client.ts`); la surface y los call sites no cambian. Hoy Amplitude por el challenge + free tier.
- **Alternativa dentro de Amplitude:** `autocapture: true` (captura indiscriminada) — descartada: ruido + PII + traiciona la taxonomy.
- **Trade-off:** 3 archivos de boilerplate **vs** vendor lock-in total + **type safety** + catálogo mantenible.
- **Snippet:**
```ts
// lib/analytics/index.ts — la ÚNICA surface que consumen los componentes
export function trackHouseViewed(props: EventCatalog["House Viewed"]): void {
  sendEvent("House Viewed", props);
}
```

### S8 — Decisión 5: `platform` en cada evento (ADR-0019)
- **Por qué mandarla siempre:** habilita la **métrica 2 ("by Platform")** y segmentación cross-evento por device **sin que cada call site lo haga explícito**.
- **Cómo:** `computePlatform()` → `web-desktop | web-mobile | web-tablet`, inyectado en `sendEvent`.
- **SSR-safe:** en server se **omite** (no manda `null`) porque el device sólo se sabe en client.
- **Trade-off:** una property global redundante vs acordarla en cada tracker → resuelto **centralizando** (DRY real).
- **Snippet:**
```ts
// lib/analytics/client.ts — ADR-0019: platform va con el evento, anonymous-safe
const platform = computePlatform();
const payload = { ...properties };
if (platform !== null) payload.platform = platform;
amplitude.track(name, payload);
```

### S9 — Decisión 6: lifecycle anónimo → conocido (ADR-0008)
- **Decisión:** form “Join the fanclub” → `setUserId(email)` + user props (`wizardName`, `favoriteHouse`, `lifecycleStage`). Sin auth real.
- **El punto clave de Amplitude:** al identificarse, Amplitude **mergea** el histórico anónimo (mismo device_id) con el perfil conocido. No se pierde el recorrido previo.
- **Snippet:**
```ts
// lib/analytics/index.ts
export function identifyFanclubMember(member: FanclubMember): void {
  setUserId(member.email.trim().toLowerCase());
  identifyUserProperties({
    lifecycleStage: "known",
    wizardName: member.wizardName.slice(0, 50),
    favoriteHouse: member.favoriteHouse,
  });
}
```
- **Visual:** diagrama de estados `docs/diagrams/lld-amplitude-flow.md`.

### S10 — Amplitude en 30s (framing)
- **¿Qué es?** product analytics **centrado en el usuario y el journey**, no en pageviews (vs Google Analytics).
- **Events** (cosas que pasan) · **event properties** (metadata del evento) · **user properties** (atributos persistentes del usuario).
- Cubierto en S7/S8/S9 con código real.

### S11 — Demo: deploy (vivo)
- `wizard-hub.vercel.app` → intro orb → `/houses` → abrí una casa → jugá una poción → buscá un mago y “See details” → “Join the fanclub”.

### S12 — Demo: Amplitude en vivo (User Activity + merge)
- Amplitude → **User Look-Up** (tu user) → **Activity**: eventos cayendo en tiempo real.
- Tras el join: mismo usuario, ahora `lifecycleStage=known` + `favoriteHouse` (el merge).

### S13 — Dashboard (2 métricas + bonus)
- Dashboard `l5wszjy1`: Onboarding → **Most viewed House (Unique Users)** → **Page /houses Viewed by Platform (Event Totals)** → Potions funnels → Wizards fuzzy tuning.
- Aclará que la métrica 2 usa `Device Category` porque `platform` vive sólo en eventos trackeados.

### S14 — Trade-offs honestos + cierre
- Fuzzy tuning: el **modelo** es el showcase; con 17 magos no hay poder estadístico → *técnica replicable*.
- Chart limit del plan starter → métrica 2 con Device Category.
- Qué sigue: funnel de onboarding, cross-favorite-house, Session Replay opt-in.
- Cierre: cumple los entregables obligatorios + arquitectura defendible.

---

# Parte 2 — Guion de acción (qué pasa en pantalla)

| Tiempo | Pantalla / acción |
|---|---|
| 0:00 | **S0** a pantalla completa. Te presentás. |
| 0:20 | **S1** (challenge). Leés los requisitos en voz alta, marcás “pageviews + ≥5 eventos” y “2 métricas”. |
| 1:00 | **S2** (HLD). Apuntás a Usuario → Vercel → API + Amplitude; mencionás ISR. |
| 1:40 | **S3** (Next.js+TS). Una decisión, un trade-off. |
| 2:30 | **S4** (SSG+ISR). Remarcá “la API de Heroku se duerme; ISR lo absorbe”. |
| 3:20 | **S5** (hexagonal). |
| 4:00 | **S6** (árbol repo). Apuntás la regla “domain no depende de afuera”. |
| 4:40 | **S7** (wrapper). **Nombrá PostHog/Mixpanel/Segment** acá. Mostrás el snippet. |
| 6:00 | **S8** (`platform`). Mostrás el snippet de `sendEvent`. |
| 7:00 | **S9** (lifecycle). Mostrás `identifyFanclubMember` + el diagrama de estados. |
| 8:20 | **S10** (qué es Amplitude). Frase corta, no te detengas. |
| 8:50 | **Cambio a browser →** abrís `wizard-hub.vercel.app`. |
| 9:00 | Navegás: intro → `/houses` → una casa → poción (acertá y errar) → `/wizards` search + “See details” → Join (completá el form). |
| 12:00 | **Cambio a Amplitude.** Project picker → **wizard-hub** → Users → **User Look-Up** (tu device_id/email) → pestaña **Activity**. Esperás segundos: los eventos caen. |
| 13:00 | Mostrá el **merge**: mismo user, props `lifecycleStage=known` + `favoriteHouse`. |
| 13:30 | **Dashboards →** wizard-hub Challenge Dashboard. Recorré Onboarding → métrica 1 → métrica 2 → Potions → Wizards. |
| 16:00 | **S14** (trade-offs). |
| 16:40 | Cierre + “preguntas”. |

---

# Parte 3 — Speech (qué decís)

> Alineado al guion. Tono directo, defensivo pero honesto.

**(0:00 — S0/S1)** “wizard-hub guía a nuevos miembros del fanclub dentro del mundo de Hogwarts. El challenge pide consumir la API de casas e instrumentar Amplitude con pageviews y al menos 5 eventos. Acá están los entregables: HLD, LLD, repo, deploy y dashboard. Voy a contar **cómo decidí**, no solo qué armé.”

**(1:00 — S2)** “Esta es la arquitectura entera: el usuario llega por Vercel, Next.js hace SSG+ISR contra la Wizard World API, y un wrapper manda eventos a Amplitude. Tres módulos: Houses, Potions y Wizards.”

**(S3–S6)** “Cuatro decisiones rápidas, cada una con su trade-off. Next.js + TypeScript strict por ecosistema y type safety. SSG+ISR porque la API vive en Heroku y **se duerme tras inactividad**; el ISR cachea en edge y absorbe esos arranques fríos. Hexagonal por módulo: el dominio no conoce la infra — si cambio la API o la tool de analytics, no toco lógica de negocio. El repo refleja eso, y un lint rule prohibe que el dominio importe capas externas.”

**(S7)** “De analytics decidí un **wrapper propio tipado**. Los componentes nunca importan el SDK; consumen funciones como `trackHouseViewed`. El catálogo `EventCatalog` es la única fuente de verdad: TypeScript no te deja mandar un evento mal nombrado. ¿Por qué importa? Porque **no me casé con Amplitude**: podría cambiar a PostHog, Mixpanel o un CDP tocando un solo archivo. Hoy Amplitude por el challenge y el free tier. Descarté el autocapture total porque captura todo de forma indiscriminada y mete ruido y PII.”

**(S8)** “Una decisión de instrumentación que vale la pena nombrar: mando **`platform` en cada evento**, automáticamente desde el wrapper. Eso habilita la métrica ‘by Platform’ y cualquier corte por dispositivo sin que cada evento se acuerde. En SSR la omito en vez de mandar null — el device sólo se sabe en el cliente.”

**(S9)** “El lifecycle: arrancás anónimo con un `device_id` automático. Al completar ‘Join the fanclub’ hago `setUserId` con el email y seteo `wizardName`, `favoriteHouse` y `lifecycleStage=known`. Lo importante de Amplitude: **al identificarse mergea tu histórico anónimo** con el perfil conocido — no perdés el recorrido previo.”

**(8:20 — S10)** “En una frase: Amplitude es product analytics centrado en el usuario y su journey, a diferencia de web analytics como Google Analytics. Todo gira alrededor de eventos, propiedades de evento y propiedades de usuario.”

**(Demo deploy)** “Pásense al deploy. Intro, casas, abro una casa, juego una poción — acerté y erré para generar ambos eventos —, busco un mago y abro sus detalles, y me uno al fanclub.”

**(Demo Amplitude)** “En Amplitude, busco mi usuario y abro su Activity. Ven los eventos cayendo en tiempo real. Después del join, **el mismo usuario** aparece con `lifecycleStage=known` y `favoriteHouse` — ese es el merge.”

**(Dashboard)** “El dashboard: onboarding y conversión, luego las dos métricas obligatorias — Most viewed House por usuarios únicos, y la página `/houses` vista por plataforma. Esta segunda usa Device Category, el proxy que Amplitude deriva del user-agent, porque nuestra `platform` viaja solo en eventos trackeados por el wrapper. Después, funnels del potion game y la distribución del rank de click en la búsqueda — **esa es la señal para tunear el fuzzyThreshold con data**.”

**(Cierre)** “Para ser honesto: el modelo de tuning fuzzy es el showcase, pero con 17 magos y el tráfico del challenge no hay poder estadístico — lo presento como técnica replicable. Cumplí los entregables obligatorios y cada decisión está documentada en 30 ADRs. Preguntas.”

---

# Parte 4 — FAQ del jurado (énfasis Amplitude)

### Amplitude — conceptos
- **¿Diferencia entre event property y user property?** Event property viaja con un evento puntual (`House Viewed` → `houseName`, `source`). User property es del perfil y persiste (`favoriteHouse`), así podés segmentar **cualquier** evento por ella.
- **¿Qué es una sesión?** ventana de actividad; cierra tras ~30 min de inactividad. La detecta el SDK (mandamos `sessions: true`).
- **¿Anonymous vs known, cómo se unen?** anónimo = `device_id` auto; al identificarme con `setUserId`, Amplitude mergea por dispositivo. No pierde el histórico.
- **¿Qué manda el SDK solo y qué mandan ustedes?** solo: page views + sesiones. Nosotros: el catálogo manual (14 eventos). Descartamos autocapture total.
- **¿Por qué `platform` en cada evento?** para que la métrica “by Platform” y cualquier corte por device funcionen **sin que cada call site lo haga**, y anonymous-safe (no depende del identify).

### Amplitude — instrumentación y diseño
- **¿Por qué un wrapper y no el SDK directo?** desacople vendor + type safety + catálogo como única fuente de verdad. Cambiar de tool = 1 archivo.
- **¿Podrían cambiar de Amplitude a otra tool?** sí — PostHog, Mixpanel, Segment. El wrapper aísla el vendor; la surface tipada (`trackHouseViewed`) no cambia.
- **¿Por qué `queryLength` y no el texto buscado?** privacidad: la query puede contener cualquier cosa; la longitud basta para análisis de fuzzy sin exponer intención/PII.
- **¿Cómo tunearían el fuzzyThreshold?** correlación `resultRank` (del click en “See details”) con `maxScrollPercent` (List Scroll Depth): si la gente clicka ranks altos y scrollea → threshold muy estricto → subirlo. Caveat: volumen bajo, es un *modelo*.
- **¿Por qué la métrica 2 usa Device Category?** nuestra `platform` la inyecta el wrapper solo en eventos trackeados; el page-view auto del SDK no la tiene. Device Category es el proxy de Amplitude.
- **¿Session Replay?** pago y graba video → lo dejé **opt-in por env var**, default off (privacidad).
- **¿Miden IA o cohorte?** el plan actual permite segmentación, funnels, retention, cohorts, paths. Session Replay y Experiment requieren plan pago.

### Arquitectura
- **¿Por qué ISR y no SSR?** perf + tolerancia a la API de Heroku dormida; el retraso de 24h es irrelevante para datos de canon.
- **¿Por qué hexagonal en una app chica?** ports → la infra cambia sin tocar dominio; el adapter de la API es swappable. Showcase de SA.
- **¿Y si la API cae?** `wizardWorldFetchSafe` (ADR-0026) degrada a fallback (p.ej. `[]`) en vez de romper el build/página.
- **¿Cómo garantizan que no se mande un evento mal?** el catálogo `EventCatalog` tipa todo en compile time; lint rule prohíbe importar el SDK fuera de `lib/analytics`.

### Trade-offs honestos
- **¿Motion ~50kb valía la pena?** sí para la orquestación del potion game (ADR-0030); CSS sigue siendo el default para lo simple/continuo. No es LCP.
- **¿Por qué tantas capas para 17 magos?** el valor es la **técnica replicable** y defender el razonamiento, no la escala.
- **¿Qué faltó?** un `Join Form Viewed` para el funnel completo, A/B (plan pago), y tracking plan cargado en el admin de Amplitude (hoy el catálogo vive en `events.ts`).
