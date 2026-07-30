# ADR-0030: Librería de animación — Motion (ex-Framer Motion)

- **Estado:** Aceptado
- **Fecha:** 2026-07-30
- **Decisor(es):** kerty + arquitecto
- **Relacionado:** ADR-0013 (design system), ADR-0014 (Tailwind), ADR-0023 (potions game design), `docs/design-system.md` §7 (open question), `todo.md` (Excalibur effort)

## Contexto

El effort "Excalibur" (animaciones estilo *Excalibur* 1981 — "torchlit armor") hasta
PR-5 es **100% CSS + canvas, sin dependencias**: torchlight/comet (PR-1), hero shimmer
+ mist (PR-2), armor-gleam en cards (PR-3), button/input affordance (PR-4), Crystal
Orb loader + intro (PR-5). Todas son animaciones simples, declarativas y one-shot:
CSS keyframes las resuelve limpio.

**PR-6 (Potion game magic)** cambia el registro: es el "big excitement win" y requiere
**orquestar múltiples elementos con estado**:

- Reveal escalonado (stagger) de las 3 reagent cards al entrar cada ronda.
- Burst de acierto (glow verde + partículas + scale-up) y de error (red fizzle +
  shake + darken), cada uno con físicas (spring/decay), no easings rígidos.
- Cauldron con superficie animada + pulso al "caer" un ingrediente (layout-driven).
- Transición de ronda (AnimatePresence: las cards salen, entran las nuevas).
- Progress dots que se "encienden" secuencialmente.

`docs/design-system.md` §7 dejaba esto como **open question**: *"try CSS keyframes
first; reach for Framer Motion (~50kb) only if CSS can't cleanly orchestrate → would
need an ADR."* Esta es la fundamentación de esa decisión.

## Decisión

Adoptar **`motion`** (la librería renombrada de *Framer Motion*, hoy en
[motion.dev](https://motion.dev)) como librería de animación para casos
**orquestrados, con estado o gestuales**. No como reemplazo general del CSS.

Reglas de uso (quedan como convención del design-system §7):

1. **CSS keyframes sigue siendo el default** para efectos simples, declarativos y
   one-shot (shimmer, sheen, orb swirl, cursor, mist). Motion **no** se usa para
   "Motion-ificar" lo que ya funciona en CSS — respeta la iridiscencia-discipline
   (§1.2: la animación es *firma*, no décor).
2. **Motion se reserva para**: secuencias/stagger, físicas (spring), animaciones
   ligadas a estado o layout (AnimatePresence, `layout`), bursts de partículas y
   gestos. Es decir, donde CSS se vuelve verboso y frágil.
3. **Import:** `import { motion } from "motion/react"` en Client Components. Para
   rutas con bundle-sensitivity se prefiere `import * as motion from
   "motion/react-client"` (entry optimizado para App Router).
4. **Accesibilidad:** usar el hook `useReducedMotion` de `motion/react` para
   degradar animaciones a estáticas (design-system §6, `prefers-reduced-motion`).
   Es el mismo contrato que ya cumplen los efectos CSS vía el bloque global en
   `globals.css`.
5. **Server Components:** Motion exige `"use client"` (o el entry `react-client`).
   Los consumidores previstos (potion game, orb) ya son Client Components.

## Alternativas consideradas

| Alternativa | Por qué se descarta |
|---|---|
| **CSS keyframes puro (status quo)** | Funciona para lo simple. Para PR-6: stagger vía `nth-child` delays, bursts = muchos nodos DOM manuales, sin físicas, transiciones de layout entre rondas muy verbosas/orquestación frágil. DX lenta para iterar el "excitement win". |
| **CSS + Web Animations API (WAAPI)** | Más control que keyframes, pero imperativo, sin integración React, hay que reimplementar springs y layout. Motion por debajo usa WAAPI cuando puede — nos quedamos con lo bueno sin reimplementar. |
| **GSAP** | Muy potente, pero imperativo, bundle mayor, menos idiomático en React y (tras la compra por Webflow) partes del ecosistema con licencia comercial. Overkill para el alcance. |
| **Motion One (`motion` vanilla, single-element)** | Más liviano, pero sin componentes React, `layout`, AnimatePresence ni gestures — justo lo que justifica la adopción. |
| **React Spring** | Alternativa válida y React-idiomática, pero ecosistema más chico y menor soporte de animaciones de layout/gestures que Motion. |

## Trade-offs aceptados

1. **+~50kb gzipped al bundle de cliente.** Es coste de runtime, no build-time.
   - **Mitigación:** el potion game es un Client Component detrás de una página ISR
     y **no es contenido above-the-fold/LCP**; se hidrata tarde. Además `motion` hace
     tree-shaking agresivo (solo se incluye lo que se importa). Si crece, se puede
     `dynamic()`-importar el juego. El orb/intro quedan en CSS (no suman Motion).
2. **Riesgo de scope creep** (Motion-ificar todo el sitio).
   - **Mitigación:** la regla §1 de la decisión (CSS como default) + la
     iridiscence-discipline. Revisar en PR review que Motion solo aparezca donde se
     justifica.
3. **Riesgo de motion-sickness** si se exageran bursts/springs.
   - **Mitigación:** `useReducedMotion` obligatorio en consumidores complejos;
     mantener duraciones en el rango de los tokens `--duration-*` del design-system.

## Consecuencias

- **Positivas:**
  - Orquestación declarativa de stagger, springs, `AnimatePresence` y `layout` —
    justo el registro que PR-6 necesita, sin CSS gimnástico.
  - `useReducedMotion` nativo → consistencia a11y con el bloque global de CSS.
  - Mejor DX/velocidad para iterar el "excitement win" (el motivo del effort).
  - `layout` y AnimatePresence habilitan transiciones de ronda limpias.
- **Negativas:**
  - Primera dependencia runtime del effort (hasta PR-5 era zero-dep). Aumenta el
    bundle de cliente del potion game.
  - Una API más que aprender/mantener.
- **Riesgos / mitigaciones:** ver Trade-offs aceptados.

## Notas

- Paquete: [`motion`](https://www.npmjs.com/package/motion) (no `framer-motion`,
  que es el nombre legacy aún publicado). Docs: https://motion.dev
- Este ADR **resuelve el open question** de `docs/design-system.md` §7. Actualizar
  esa sección a "decidido — ver ADR-0030" en el PR que aterrice Motion.
- Primer consumidor: PR-6 (Potion game magic). El Crystal Orb (PR-5) **permanece en
  CSS** salvo que un follow-up decida lo contrario (ADR-0011: PRs enfocados).
