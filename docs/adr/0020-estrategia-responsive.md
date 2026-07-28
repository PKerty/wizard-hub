# ADR-0020: Estrategia responsive — mobile-first con Tailwind defaults

- **Estado:** Aceptado
- **Fecha:** 2026-07-28
- **Decisor(es):** kerty + arquitecto
- **Relacionado:** [ADR-0013](./0013-visual-identity.md) (identidad visual), [ADR-0014](./0014-stack-css-tailwind.md) (Tailwind), [ADR-0009](./0009-estructura-app-router-hexagonal-ddd.md) (estructura)

## Contexto

La app se construyó mobile-tolerante pero sin una estrategia responsive explícita. Auditoría (2026-07-28) detectó problemas concretos:

1. **Nav sin menú móvil**: 3 links (`Home`, `Houses`, `Join`/`Sign Out`) + brand + ThemeToggle en línea con `gap-8`. En viewports `<400px` los textos (`text-eyebrow uppercase tracking-[0.2em]`) se comprimen o desbordan.
2. **Tipografía fija sin `clamp()`**: `--text-hero` (`4rem`) y `--text-display` (`2.75rem`) son estáticos. Solo `--text-mega` fluye. En mobile los H1 de `/join` y `/houses/[id]` desbordan.
3. **Touch targets bajo mínimo WCAG 2.5.5 (44×44px)**: links del Nav, Footer y `Back to Houses` son texto pelado sin `min-h-11`/padding táctil.
4. **Metadata line larga en house detail**: la línea `Founder · X · Animal · Y · Ghost · Z` no tiene reflow, corta mal en mobile.
5. **CTAs angostos en mobile**: `inline-flex px-6 py-3` queda chico en pantallas estrechas.

Falta una decisión que fije breakpoints, reglas táctiles, estrategia de nav móvil y tipografía fluida.

## Decisión

**Mobile-first con los breakpoints por defecto de Tailwind v4**, sin custom config. Toda regla CSS/CX parte del viewport más chico y escala con `sm:`/`md:`/`lg:`.

### 1. Breakpoints

| Token | Pixel | Uso típico |
|---|---|---|
| (base) | `<640` | Móvil — 1 columna, tipografía clamp, nav condensada |
| `sm` | `≥640` | Tablets chicas / landscape phone — 2 columnas houses, nav expandida |
| `md` | `≥768` | Tablets — footer horizontal, py grande |
| `lg` | `≥1024` | Desktop — 4 columnas houses |

No se definen breakpoints custom en `tailwind.config.ts` (mantener ADR-0014: tokens via `@theme`, no config).

### 2. Nav móvil — estrategia "condensar, no hamburguesa"

En `< sm` se elimina el link `Home` explícito (el brand "wizard-hub" ya es link a `/`) y se mantiene `Houses` + `Join`/`Sign Out` + `ThemeToggle` en línea con `gap-4`. Si la auditoría visual muestra que igual desborda, caer a **hamburguesa** como ADR futuro.

Justificación: hamburguesa agrega estado client, drawer, focus trap y más tests. Para 2 links + toggle no se justifica (AGENTS.md §2.6 "no abstraer por abstraer").

### 3. Tipografía fluida con `clamp()`

Convertir a `clamp()` las 3 escalas grandes para que fluyan desde mobile:

```css
--text-mega:    clamp(2.5rem, 6vw + 1rem, 6rem);       /* 40px → 96px */
--text-hero:    clamp(2rem,  4vw + 1rem, 4rem);        /* 32px → 64px */
--text-display: clamp(1.75rem, 2.5vw + 1rem, 2.75rem); /* 28px → 44px */
```

El resto (`h2`, `h3`, `body-lg`, `body`, etc.) se mantiene fijo porque ya son legibles en mobile.

### 4. Touch targets mínimos

Todo elemento clicable del chrome (no de contenido) debe cumplir **44×44px mínimo** (WCAG 2.5.5):

- Links del Nav: envolver texto en `<span>` con `inline-flex min-h-11 items-center px-1`.
- Links del Footer: mismo patrón.
- `Back to Houses`: `min-h-11 inline-flex items-center`.
- `ThemeToggle`: verificar tamaño existente, ajustar si hace falta.

No se aplica a CTAs principales (`CtaLink`, `JoinCta`) que ya tienen `px-6 py-3` (~44px).

### 5. CTAs en mobile — `w-full sm:w-auto`

Los CTAs (`CtaLink`, `JoinCta` del house detail, botón "Join the Order" del form) pasan a `w-full sm:w-auto` para que en mobile ocupen todo el ancho del contenedor (patrón mobile-canónico).

### 6. Metadata de House Detail — `flex-col sm:flex-row`

La línea `Founder · X · Animal · Y · Ghost · Z` se convierte en lista vertical en mobile y horizontal en `sm+`:

```tsx
<ul className="mt-6 flex flex-col gap-1 font-mono text-mono-data text-moonlight sm:flex-row sm:gap-3">
  <li>Founder · {house.founder}</li>
  <li>Animal · {house.animal}</li>
  <li>Ghost · {house.ghost}</li>
</ul>
```

### 7. Viewport meta

Next.js inyecta `width=device-width, initial-scale=1` por defecto. Lo dejamos — no se deshabilita el zoom del usuario (accesibilidad).

## Alternativas consideradas

| Alternativa | Por qué se descarta |
|---|---|
| **Hamburguesa con drawer desde el inicio** | Overkill para 2-3 links. Agrega estado, focus trap, animación y tests. Solo si "condensar" no alcanza tras auditoría visual. |
| **Breakpoints custom** (ej. `xs: 480px`) | Tailwind v4 defaults cubren el caso. Custom agrega mantenimiento. Viola "minimal primero" (AGENTS.md §2.1). |
| **`@media (max-width)` en CSS global** | Tailwind es mobile-first con `min-width`. Mezclar rompe la convención. Todo va por utilidades `sm:`/`md:`/`lg:`. |
| **Touch target solo en `<a>` con padding global** | Globales afectan contenido (links inline en párafos). Prefiero aplicar el patrón explícito a los elementos del chrome. |
| **Tipografía con `@media` queries en `globals.css`** | `clamp()` logra lo mismo sin queries, sin saltos, y fluye continuamente. Mejor DX. |

## Consecuencias

- **Positivas:**
  - Cumple WCAG 2.5.5 (target size) — defendible en presentación.
  - Tipografía fluida: cero saltos en resize, legible de 320px a 2560px.
  - Reglas aplicables a futuras páginas (`/wizards`, search) sin redecidir.
  - Cero JS nuevo (la estrategia es puramente CSS/Tailwind) → cero tests de comportamiento extra.
- **Negativas:**
  - Se acepta que el nav no tendrá >5 links en mobile. Si la app crece ( Wizards, Search, Account), probablemente requiera hamburguesa → ADR futuro.
  - `clamp()` es matemática: tunear valores requiere probar en breakpoints reales. Mitigación: validar en DevTools mobile.
- **Riesgos / mitigaciones:**
  - **Heurística "condensar" puede no alcanzar** en <360px. Mitigación: testear con iPhone SE (375px) y Galaxy Fold (280px); si rompe, abrir ADR-0021 con hamburguesa.
  - **`min-h-11` sobre texto puede descuadrar baseline**. Mitigación: `inline-flex items-center` centra verticalmente.
- **Acciones derivadas:**
  - Implementar en `feat/008-mobile-revamp` (probablemente 2 PRs: tipografía+touch targets como el más chico; nav condensada+CTAs+metadata como el más grande).
  - Actualizar `docs/design-system.md` con sección "Responsive" que resuma este ADR.

## Notas

- WCAG 2.5.5 Target Size (Level AAA) fija 44×44 CSS px. WCAG 2.5.8 (Level AA, 2.2) fija 24×24 — cumplimos el más estricto.
- Mobile-first en Tailwind: <https://tailwindcss.com/docs/responsive-design#working-mobile-first>
- clamp() para tipografía fluida: <https://developer.mozilla.org/en-US/docs/Web/CSS/clamp>
- Esta es una **extensión** de ADR-0013/0014. No los reemplaza.
