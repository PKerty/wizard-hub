# ADR-0014: Stack CSS — Tailwind CSS

- **Estado:** Aceptado
- **Fecha:** 2026-07-27
- **Decisor(es):** kerty + arquitecto
- **Relacionado:** ADR-0009 (estructura), ADR-0013 (design system), DESIGN-002

## Contexto
El design system (`docs/design-system.md`) define tokens de color, tipografía, spacing, radius, motion. Necesitamos un stack CSS que los traduzca a componentes Next.js de forma eficiente, sin fricción con SSR (Next.js App Router).

## Decisión
Usar **Tailwind CSS** (última estable, hoy v4) como stack CSS único del proyecto.

### Tokens → Tailwind
Los tokens del design system se mapean 1:1 en `tailwind.config.ts`:

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        'bg-void':       '#0A0E1A',
        'bg-mist':       '#141A2A',
        'bg-fog':        '#0F1422',
        steel:           '#C4CDD9',
        moonlight:       '#9DB7D9',
        whisper:         '#5A6B85',
        torchlight:      '#D4A24B',
        'sigil-violet':  '#A78BFA',
        'iri-cyan':      '#7FD9C9',
        'iri-magenta':   '#D97FA9',
        'iri-violet':    '#B89DFA',
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: { sharp: '0', soft: '4px', card: '8px' },
      transitionTimingFunction: {
        arcane: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        sigil:  'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: { fast: '150ms', base: '300ms', slow: '500ms', ritual: '800ms' },
    },
  },
};
```

Dark/light modes se manejan con el atributo `data-theme` en `<html>` y `:root[data-theme="light"]` overrides en CSS global (no dark: variant nativa, porque nuestro light no es "Tailwind default" sino "Ministerio diurno" — ver design-system.md §2).

### Componentes complejos → `@layer components` o React components
El shimmer signature y el crystal orb loader viven como componentes React con CSS Modules o `@layer` en Tailwind v4 (no como utilities dispersas, para mantener el "single source of truth" del design system).

## Alternativas consideradas
| Alternativa | Por qué se descarta |
|---|---|
| **CSS Modules** | Nativo, scoped, pero verboso para design systems. Tokens deberían importarse en cada file. Lento para iterar. |
| **vanilla-extract** | Type-safe, ideal en teoría, pero setup más pesado y curves de adopción. Overkill para el scope. |
| **CSS-in-JS (styled-components, emotion)** | Penalty de runtime, no recomendado por el equipo de Next.js para App Router. Hidratación más lenta. |
| **CSS plano con custom properties** | Funciona, pero no hay utility layer → cada componente escribe CSS desde cero. Lento. |
| **Panda CSS / UnoCSS** | Alternativas válidas, pero Tailwind tiene mejor ecosistema, ejemplos en docs de Next.js/Vercel, y soporte en IDE. |

## Trade-offs aceptados

1. **Verbosidad de clases en JSX.** `className="bg-bg-void text-steel font-display text-display"` es ruidoso.
   - **Mitigación:** extraer patrones recurrentes a componentes React (`<HouseCard>`, `<SigilEyebrow>`, `<Button variant="primary">`).
2. **Riesgo de "parece Tailwind".** Es decir, mirar el sitio y saber que es Tailwind porque usa los defaults.
   - **Mitigación:** la paleta Moonlit Armor y el signature shimmer alejan visualmente del default. Tailwind no impone estética, solo mecanismo.
3. **Curva para equipos nuevos.**
   - **Mitigación:** documentar convenciones en `docs/design-system.md` §"Cómo extender". Es Challenge personal; no aplica hoy.

## Consecuencias
- **Positivas:**
  - Iteración muy rápida en UI (hot reload, sin context-switch CSS↔JSX).
  - CSS final purgeado → bundle mínimo.
  - Sin runtime → óptimo para SSR/SSG (alinea ADR-0005).
  - Ecosistema y docs alineados con Next.js (skill `vercel-react-best-practices` lo asume).
- **Negativas:**
  - `tailwind.config.ts` y CSS global son fuentes paralelas de tokens (design-system.md + config). Mantenerlos sincronizados es disciplina.
  - Plugins y variantes específicas pueden sumar complejidad.
- **Acciones derivadas:**
  - Instalar `tailwindcss` + `@tailwindcss/postcss` (v4) en setup inicial.
  - Configurar path aliases en `tsconfig.json` antes del primer component.
  - Crear componentes envoltorio para tokens complejos (Button, HouseCard, CrystalOrbLoader) — ver ADR-0009 §"components/".

## Notas
- Doc oficial: https://tailwindcss.com/docs/installation
- Next.js + Tailwind guide: https://nextjs.org/docs/app/building-your-application/styling/tailwind-css
- Versionar `tailwind.config.ts` con comentarios cortos que apunten al design-system.md.
