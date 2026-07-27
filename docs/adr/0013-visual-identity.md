# ADR-0013: Identidad visual — "Moonlit Armor" (iridiscente esotérico)

- **Estado:** Aceptado
- **Fecha:** 2026-07-27
- **Decisor(es):** kerty + arquitecto
- **Relacionado:** ADR-0007 (event `Theme Toggled`), DESIGN-001
- **Spec canónico:** `docs/design-system.md`

## Contexto
Necesitamos definir identidad visual para wizard-hub. Brief del usuario:

- "Digital wizardry": fantasia que se sabe dentro de internet.
- Imaginería: wizard con bola de cristal haciendo tech support / call center; wizard que compra en Amazon.
- Referencias: **Excalibur (1981)** (especialmente el brillo cromático en armaduras) + **Matrix**, focalizado en Harry Potter.
- Explícitamente: **evitar** verde fósforo sobre negro puro (default Matrix). Más esotérico.

La skill `frontend-design` advierte sobre 3 defaults que la IA produce sin pensar:
1. Cream + serif + terracota.
2. Negro puro + acento verde/vermilion acid.
3. Broadsheet con hairlines y cero radius.

Cualquier propuesta que caiga en (2) es una traición al brief.

## Decisión
Adoptar la dirección visual **"Moonlit Armor"** definida en `docs/design-system.md`:

- **Paleta:** navy-noche profundo + plata-acero + luz de luna azul + un único acento cálido (torchlight gold) + shimmer iridiscente (cyan/magenta/violet) como textura, no como color.
- **Tipografía:** Cinzel (display) + Inter (body) + JetBrains Mono (data). La fricción antiguo/moderno es el concepto.
- **Signature:** "Chromatic Shimmer" — textura iridiscente (estilo madreperla/aceite sobre agua) aplicada con restraint en 3-5 lugares clave.
- **Patrones:** niebla en backgrounds (gradientes sutiles, nunca sólidos), numeración romana + mono para "data oculta", crystal orb loader con superficie nácar.
- **Modos:** dark "Hogwarts nocturno" (default) + light "Ministerio diurno" (toggle, ADR-0007).

## Alternativas consideradas
| Alternativa | Por qué se descarta |
|---|---|
| **"Matrix con varita"** (negro puro + verde fósforo + mono) | Default genre. El usuario lo rechazó explícitamente. No específico al subject. |
| **"Pergamino y tinta"** (papel envejecido + serif) | Hermoso pero pierde el "internet/Amazon" del brief. Demasiado medieval, poco digital. |
| **"Cyberpunk neon"** (backgrounds oscuros + neón saturado) | Default AI #2. Sin anclaje a Excalibur ni HP. |
| **"Hogwarts literal"** (réplica del site oficial Wizarding World) | Sin personalidad. Replica, no dirección propia. |

## Trade-offs aceptados

1. **Iridiscencia es difícil de ejecutar bien.** CSS gradients con múltiples paradas + `background-clip: text` + `mix-blend-mode` son delicados. Riesgo de verse barato si se aplica mal.
   - **Mitigación:** reglas estrictas en `design-system.md` sobre dónde aparece (máximo 3-5 lugares). Prototipar el efecto aislado antes de integrarlo.
2. **Tensión tipográfica Cinzel/Mono puede chocar.** Si se mezclan mal, parece collage.
   - **Mitigación:** roles claros — Cinzel solo display, Mono solo data readouts cortos, Inter todo lo demás.
3. **Dark mode como default** puede sorprender a algunos usuarios.
   - **Mitigación:** respetar `prefers-color-scheme` en primera visita, persistir elección en localStorage.
4. **Riesgo de "over-design".** Es fácil caer en la tentación de shimmer en todo.
   - **Mitigación:** principio Chanel del AGENTS.md (sacar un accesorio antes de salir). Review explícita en PRs visuales.

## Consecuencias
- **Positivas:**
  - Direccion visual única y defendible ("no es default AI").
  - Material narrativo fuerte para la presentación: trade-offs, decisiones de marca.
  - Flexibilidad para crecer (tokens soportan más componentes sin rediseño).
- **Negativas:**
  - Costo de implementación: el shimmer requiere CSS cuidado + tests visuales.
  - Mantenimiento: design system debe actualizarse al agregar componentes.
- **Acciones derivadas:**
  - Crear `docs/design-system.md` (este ADR es la puerta).
  - Decidir stack CSS en ADR futuro (Tailwind / CSS Modules / vanilla-extract). Mientras tanto, los tokens viven como CSS variables nativas.
  - Prototipar el "Crystal Orb Loader" y "Chromatic Shimmer" aislados antes del primer uso productivo.
  - Definir ícono set consistente (¿heroicons? ¿custom SVG con estilo heráldico?). Futuro ADR.

## Notas
- Referencias visuales: Excalibur (1981, John Boorman); Harry Potter (Warner Bros, specs del Wizarding World brand).
- Herramienta para prototipar shimmer: Figma o CodeSandbox con CSS puro.
- `prefers-color-scheme`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme
