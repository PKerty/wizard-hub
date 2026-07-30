# ADR-0029: Efecto ambiental que sigue al puntero (torchlight / cometa)

- **Estado:** Aceptado
- **Fecha:** 2026-07-30
- **Decisor(es):** Maintainer wizard-hub
- **Extiende:** ADR-0013 (Identidad visual — "Moonlit Armor")

## Contexto

La identidad visual de ADR-0013 ("Excalibur 1981": acero cromático bajo luz de luna, niebla wagneriana) define tokens de iridiscencia y glow (`--torchlight`, `--iri-*`, `--glow-*`) que **apenas se usaban** en la UI. La app se percibía plana y poco "mágica" para ser un fanclub de Harry Potter.

Se quería un elemento *ambiental* que diera vida y reforzara el concepto Excalibur: **una luz que acompaña al visitante**. Restricciones:

1. Debe verse bien en **ambos** temas (dark "Hogwarts nocturno" / light "Ministerio diurno").
2. Sin nuevas dependencias (mantener CSS/canvas puro; ADR-0013 §7 deja Framer Motion abierto solo para animaciones complejas).
3. Respetar accesibilidad: `prefers-reduced-motion` y `pointer: coarse` (sin hover en táctil).
4. No obstaculizar la interacción (`pointer-events: none`) ni tapar el contenido.

Además, los botones/inputs **no se percibían clickeables** (Tailwind v4 preflight no fuerza `cursor: pointer` en `<button>`), problema ortogonal pero abordado en el mismo incremento.

## Decisión

1. **Cursor global** (`globals.css` en `@layer base`): elementos interactivos (`a[href]`, `button:not(:disabled)`, `[role=button]`, `summary`, `label[for]`, radios/checkboxes, `[data-clickable]`) muestran cursor mano; inputs de texto muestran cursor texto. Las utilidades `cursor-*` siguen pudiendo sobreescribir.

2. **Efecto que sigue al puntero, adaptado por tema:**
   - **Dark:** `body::after` con un radial **torchlight** cálido + halo iridiscente tenue, posicionado por vars CSS `--torch-x` / `--torch-y` (escritas por `TorchlightCursor` vía `pointermove` + rAF). Es la "antorcha llevada entre la niebla".
   - **Light:** el radial cálido es casi invisible sobre pergamino, así que `body::after` se oculta y un **canvas pinta una estela tipo cometa** cian (`CometTrail`): técnica de fade persistente (`destination-out` por frame) + segmento glowing interpolado + cabeza brillante con blend `lighter`. Loop idle-aware (se detiene ~1s tras parar el puntero).

3. **Componentes** en `components/effects/`:
   - `TorchlightCursor` — escribe las vars CSS (dark).
   - `CometTrail` — canvas (light).
   - Montados una sola vez en `app/layout.tsx`.

## Alternativas consideradas

- **Mismo efecto en ambos temas:** descartado. El radial cálido no se ve en light, y un halo cian grande "se sentía raro" sobre pergamino (feedback iterativo). Adaptar por tema quedó más natural.
- **Iridiscencia cian como radial en light:** probado y descartado por feedback ("feels weird the cyan iridescent").
- **Puntos/sparkles discretos:** probados (trail de fairy-dust dorado, luego cian); se prefirió la **estela continua tipo cometa** por parecer más fluida.
- **Framer Motion / lib de partículas:** descartado por ahora (ADR-0013 §7). CSS + canvas puro bastan para este caso; se reevaluará si surgen animaciones orquestadas complejas (ver ADR-0013 §7 y el roadmap de la rama `animations`).
- **Cursor `pointer` componente por componente:** descartado por duplicación; una regla global en `@layer base` lo resuelve de una vez.

## Consecuencias

- **Positivas:** La UI gana vida y reforzza el concepto Excalibur sin nuevo peso de bundle. Los efectos son GPU-friendly (una sola capa/effekt-node, rAF idle-aware). El cursor se arregla app-wide.
- **Negativas:** Dos componentes client ligan `pointermove`/rAF; el cometa corre un loop mientras hay actividad en light. Costo de CPU/batería mínimo pero no cero.
- **Riesgos / mitigaciones:**
  - *Performance:* rAF throttleado (torch) y loop idle-aware que se detiene (cometa); cap de partículas removido al pasar a cometa. `prefers-reduced-motion` y `pointer: coarse` desactivan todo.
  - *Legibilidad:* el torch está por encima del contenido (z-30) con `pointer-events:none` y alfa bajo (~12%); no tapona texto.
  - *Mantenibilidad:* dos estrategias distintas por tema aumentan la superficie; se acepta porque cada tema pide un medio distinto (niebla vs. pergamino).

## Notas

- Inspiración: *Excalibur* (1981, John Boorman) — antorchas entre la niebla, brillo cromático en armaduras (ADR-0013 §1).
- Implementación: PR-1 de la rama `animations` (commits squash-merged como #40).
- Roadmap de animaciones restante (misma rama): hero shimmer, mist drift, house-card gleam, affordance de botones/inputs, Crystal Orb loader (ADR-0013 §4.1), magia del Potions game.
- Intensidad acordada: "Medium" (~12% warm + halo iridiscente tenue en dark; cometa cian sutil en light).
