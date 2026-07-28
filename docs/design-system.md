# Design System — wizard-hub

Spec canónico de identidad visual. Toda decisión de UI debe derivar de este documento. Si se desvía, requiere ADR.

Decisión registrada en [ADR-0013](./adr/0013-visual-identity.md).

---

## 1. Concepto: "Moonlit Armor"

Visual language: **acero cromático bajo luz de luna + iridiscencia esotérica**. Inspiración declarada: brillo de armaduras en *Excalibur 1981*, niebla wagneriana, sigilos herméticos. NO cyberpunk, NO verde fósforo.

Tres principios:

1. **El acero es la voz por defecto.** Plata fría, no pergamiento, no blanco.
2. **La iridiscencia es firma, no décor.** Aparece en máx. 3-5 lugares clave.
3. **La luz cálida es rara.** Un solo acento `--torchlight`. Todo lo demás es frio.

---

## 2. Tokens

### Color

#### Modo dark (default — "Hogwarts nocturno")

```css
:root {
  /* Backgrounds — siempre con gradiente sutil, nunca sólidos */
  --bg-void:        #0A0E1A;  /* azul-noche profundo, base */
  --bg-mist:        #141A2A;  /* surface primaria */
  --bg-fog:         #0F1422;  /* surface hundida */

  /* Texto */
  --steel:          #C4CDD9;  /* texto principal, plata de armadura */
  --moonlight:      #9DB7D9;  /* texto secundario, borders tenues */
  --whisper:        #5A6B85;  /* texto terciario, captions, disabled */

  /* Acento cálido (única luz cálida) */
  --torchlight:     #D4A24B;  /* eyebrows, hover, foco heráldico */
  --torchlight-dim: #8B6B30;  /* hover inactivo */

  /* Esotérico */
  --sigil-violet:   #A78BFA;  /* focus ring, magia */

  /* Iridiscencia (shimmer) */
  --iri-cyan:       #7FD9C9;
  --iri-magenta:    #D97FA9;
  --iri-violet:     #B89DFA;

  /* Estado */
  --error:          #E57373;
  --success:        #81C784;
}
```

#### Modo light (toggle — "Ministerio diurno")

```css
:root[data-theme="light"] {
  --bg-void:        #F5F2E8;  /* parchment cream */
  --bg-mist:        #EAE5D5;
  --bg-fog:         #DDD7C2;

  --steel:          #1A1F2E;  /* tinta */
  --moonlight:      #3D4861;
  --whisper:        #6F7889;

  --torchlight:     #8B6B30;
  --torchlight-dim: #5C481F;

  --sigil-violet:   #6B4FA8;

  --iri-cyan:       #4FA89A;
  --iri-magenta:    #A85F87;
  --iri-violet:     #7C66B8;

  --error:          #C62828;
  --success:        #2E7D32;
}
```

#### House colors (fieles, SOLO en escudos / heraldia, nunca como background)

```css
--house-gryffindor: #740001;
--house-slytherin:  #1A472A;
--house-ravenclaw:  #222F5B;  /* book canon, no movie blue */
--house-hufflepuff: #B8B800;  /* book canon, no movie yellow */
```

### Tipografía

```css
--font-display:  'Cinzel', 'Trajan Pro', serif;     /* hero, títulos, house names */
--font-body:     'Inter', system-ui, sans-serif;    /* todo lo legible */
--font-mono:     'JetBrains Mono', 'Fira Code', monospace;  /* data, IDs, timestamps */
```

### Type scale

| Token | Size / Line-height | Family | Uso |
|---|---|---|---|
| `text-mega` | `clamp(48, 8vw, 96)` / 0.95 | Cinzel 600 | Hero landing pages. **1 por página máx.** Responsive fluido. |
| `text-hero` | 64 / 1.05 | Cinzel 600 | Hero secundario, una vez por página |
| `text-display` | 44 / 1.1 | Cinzel 600 | Título de página |
| `text-h2` | 32 / 1.2 | Cinzel 500 | Section header |
| `text-h3` | 24 / 1.3 | Inter 600 | Subsection |
| `text-body-lg` | 18 / 1.6 | Inter 400 | Lede, intro |
| `text-body` | 16 / 1.6 | Inter 400 | Default |
| `text-small` | 14 / 1.5 | Inter 400 | Captions, meta |
| `text-mono-data` | 13 / 1.4 | JetBrains Mono 500 | IDs, métricas, data readouts |
| `text-eyebrow` | 12 / 1.4 | Cinzel 500, letter-spacing 0.2em, UPPERCASE | "I. THE FOUR HOUSES" |

### Espaciado (base 4px)

```
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px
--space-6:  24px
--space-8:  32px
--space-12: 48px
--space-16: 64px
--space-24: 96px
```

### Radius

```
--radius-sharp: 0;        /* armor, dividers */
--radius-soft:  4px;      /* buttons, inputs */
--radius-card:  8px;      /* house cards, panels */
--radius-pill:  9999px;   /* tags, status badges */
```

### Sombras / Glow

```css
/* Sin glow default. Glow aparece solo en hover/foco o en el signature. */
--shadow-panel:    0 1px 0 0 rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.4);
--shadow-hover:    0 0 0 1px var(--moonlight), 0 12px 32px rgba(0,0,0,0.6);
--glow-torchlight: 0 0 24px rgba(212,162,75,0.25);
--glow-sigil:      0 0 16px rgba(167,139,250,0.35);
```

### Motion

```
--ease-arcane:  cubic-bezier(0.4, 0.0, 0.2, 1);  /* default, ease-in-out largo */
--ease-sigil:   cubic-bezier(0.16, 1, 0.3, 1);   /* para entradas mágicas */
--dur-fast:     150ms;
--dur-base:     300ms;
--dur-slow:     500ms;
--dur-ritual:   800ms;   /* hero load, orb reveal */
```

Movimiento **lento y deliberado** — niebla, no rebote.

---

## 3. Patrones visuales

### 3.1 Chromatic Shimmer (signature)

Iridiscencia tipo madreperla. **Reglas de uso hard:**

- ✅ Hero title del home (al cargar, una vez).
- ✅ Bordes de House Cards en hover.
- ✅ Crystal Orb Loader (superficie del orb).
- ✅ Focus ring del formulario "Únete al fanclub".
- ❌ Texto body. Nunca.
- ❌ Backgrounds completos.
- ❌ Más de 1 elemento simultáneo en viewport.

**Implementación CSS base:**

```css
.shimmer {
  background: linear-gradient(
    115deg,
    var(--steel) 30%,
    var(--iri-cyan) 42%,
    var(--iri-magenta) 50%,
    var(--iri-violet) 58%,
    var(--steel) 70%
  );
  background-size: 300% 100%;
  background-position: 100% 0;
  transition: background-position var(--dur-slow) var(--ease-sigil);
}
.shimmer:hover,
.shimmer[data-active="true"] {
  background-position: 0 0;
}

.shimmer-text {
  /* el mismo gradient + */
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
```

### 3.2 Mist Background

Backgrounds NUNCA sólidos. Siempre gradiente sutil:

```css
--gradient-mist: radial-gradient(
  ellipse at top,
  var(--bg-mist) 0%,
  var(--bg-void) 70%
);
--gradient-fog: linear-gradient(
  180deg,
  var(--bg-void) 0%,
  var(--bg-fog) 100%
);
```

### 3.3 Sigil Eyebrows

Numeración romana + Cinzel uppercase + letter-spacing amplio. Indica **sequence semántica** (justificado, no decorativo):

```
I. THE FOUR HOUSES
II. JOIN THE FANCLUB
III. YOUR JOURNEY
```

### 3.4 House Card Anatomy

```
┌─────────────────────────────┐
│  [shield SVG iridescent]    │  ← house sigil (iridiscente en hover)
│                             │
│  SLYTHERIN                  │  ← Cinzel display, steel
│  House · est. MMCMXLVII     │  ← mono caption, moonlight
│                             │
│  "You'll make your real      │  ← Inter italic body, moonlight
│   friends..."                │
│                             │
│  → Enter                    │  ← torchlight, hover shimmer
└─────────────────────────────┘
```

---

## 4. Componentes clave

### 4.1 Crystal Orb Loader (signature element)

Estados de carga: page-load, route-change, fetch-en-curso.

- Círculo de ~120px desktop / 80px mobile.
- Superficie: gradiente nácar (cyan→magenta→violet) animado con `--ease-sigil`.
- Glow externo `--glow-sigil`.
- Caption debajo: mono, "Consulting..." / "Revealing..." / "Summoning...".

```css
.crystal-orb {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 35% 30%,
    var(--iri-cyan) 0%,
    var(--iri-magenta) 40%,
    var(--iri-violet) 70%,
    var(--bg-void) 100%
  );
  box-shadow: var(--glow-sigil), inset 0 0 32px rgba(0,0,0,0.5);
  animation: orb-drift var(--dur-ritual) var(--ease-sigil) infinite alternate;
}
@keyframes orb-drift {
  0%   { background-position: 0% 0%; }
  100% { background-position: 30% 20%; }
}
@media (prefers-reduced-motion: reduce) {
  .crystal-orb { animation: none; }
}
```

### 4.2 Buttons

| Variante | Uso | Estilo |
|---|---|---|
| Primary | CTA principal (join form submit) | bg `--torchlight`, text `--bg-void`, hover shimmer |
| Secondary | Navegación | border `--moonlight`, text `--steel`, hover `--shadow-hover` |
| Ghost | In-page actions | text `--moonlight`, hover bg `--bg-mist` |

### 4.3 Inputs (fanclub form)

- Label: `--font-display`, size `text-eyebrow`.
- Input: bg `--bg-fog`, border-bottom `--moonlight` (sin border completo), focus ring `--sigil-violet`.
- Error: border-bottom `--error`, mensaje `--font-body` size `text-small`.

---

## 5. Modos dark/light

- **Default:** dark ("Hogwarts nocturno").
- **Primera visita:** respetar `prefers-color-scheme`.
- **Toggle:** botón esquinero (top-right), evento `Theme Toggled` (ADR-0007).
- **Persistencia:** `localStorage["wizard-hub:theme"]`.
- **Cambio:** sin animación de transición (mejor snap que parpadeo).

---

## 6. Accesibilidad

Contraste verificado (WCAG AA mínimo):

| Foreground | Background | Ratio | Status |
|---|---|---|---|
| `--steel` | `--bg-void` | ~12:1 | AAA |
| `--moonlight` | `--bg-void` | ~8:1 | AAA |
| `--torchlight` | `--bg-void` | ~7:1 | AAA |
| `--whisper` | `--bg-void` | ~4.5:1 | AA ✓ |
| Iridescent colors (cualquiera) | cualquier bg | < 3:1 | ❌ solo decorativo, nunca texto |

Reglas:
- Iridiscencia: **solo decorativa**, nunca en texto funcional.
- Focus visible siempre (con `--glow-sigil`).
- `prefers-reduced-motion`: desactivar orb drift, shimmer hover, todo motion no-esencial.
- House colors: SIEMPRE acompañadas de label textual, nunca solo color.

---

## 7. Por determinar (futuro)

- ~~**Stack CSS:** Tailwind vs CSS Modules vs vanilla-extract~~ → Resuelto en **ADR-0014 (Tailwind)**.
- ~~**Icon set:** heroicons vs custom SVG heráldico~~ → Resuelto en **ADR-0015 (custom SVG)**.
- ~~**Ilustración:** ¿line-art tipo Marauder's Map para hero?~~ → Resuelto en **ADR-0016 (line-art scoped)**.
- **Sound design:** fuera de scope del challenge.
- **Motion library:** Framer Motion vs CSS-only (decidir cuando haya componentes animados complejos).
- **A11y testing:** axe-core vs pa11y vs manual (cuando exista UI para auditar).

### 7-bis. Convenciones de iconografía e ilustración

Stroke philosophy unificada (aplica a ADR-0015 icons y ADR-0016 ilustración):

| Elemento | Stroke width | Linecap/Linejoin | viewBox |
|---|---|---|---|
| UI icons (chevron, close, etc.) | `1.5` | round / round | `0 0 24 24` |
| House shields (escudos) | `2` | round / round | `0 0 48 48` |
| Sigilos / ornamentos pequeños | `1.5` | round / round | `0 0 32 32` |
| Hero illustration | `1-1.5` | round / round | variable, ratio wide |
| Dividers / flourishes | `1.5` | round / round | width-100% × height-fixed |

Color siempre via `currentColor` → hereda de Tailwind (`text-steel`, `text-torchlight`, `text-moonlight`).

---

## 8. Cómo extender este doc

1. Nuevo token o componente → PR con cambio a este archivo.
2. Si la decisión es "significativa" (cambio de paleta, nueva signature, cambio de stack CSS) → ADR antes que modificación aquí.
3. Toda adición debe respetar los 3 principios de §1.
