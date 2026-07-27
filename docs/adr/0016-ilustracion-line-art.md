# ADR-0016: Ilustración — line-art tipo "Marauder's Map"

- **Estado:** Aceptado
- **Fecha:** 2026-07-27
- **Decisor(es):** kerty + arquitecto
- **Relacionado:** ADR-0013 (visual identity), ADR-0015 (icons), DESIGN-004

## Contexto
El design system "Moonlit Armor" necesita una capa de ilustración decorativa para:
- Hero del home (elemento visual principal que establece tono).
- Divisores entre secciones.
- Ornamentos estructurales (corner ornaments, flourishes).
- Decoración de fondo sutil (constelaciones, sigilos grandes).

La identidad rechaza photography genérica y 3D renders. Necesitamos algo coherente con lo esotérico + armor sheen.

## Decisión
Adoptar **line-art** como tratamiento ilustrativo. Referencia canónica: **Marauder's Map** de Harry Potter — dibujos animados de contornos, single-weight strokes, sin relleno ni sombreado, estilo manuscrito/blueprint.

### Alcance (cap explícito — importante)
**v1, máximo:**
- **1 hero illustration** grande en home (castillo, mago, owl, o composición de elementos HP).
- **4-6 ornamentos reutilizables:** dividers de sección, corner ornaments para House Cards.
- **Opcional:** constellation line-art sutil como background en 1-2 páginas.

**v2+** se discute cuando v1 esté en producción. **No se empieza como proyecto de "gran ilustración completa".**

### Convenciones del estilo
- **Stroke-based, sin fills.** `stroke-width: 1-1.5` uniforme dentro de una composición.
- `viewBox` rectangular generoso (`0 0 1200 400` para hero wide).
- `stroke-linecap="round"`, `stroke-linejoin="round"` — mano hábil, no técnico.
- Color: stroke hereda `currentColor` (Tailwind `text-torchlight`, `text-steel`, `text-moonlight`).
- Animación opcional vía `stroke-dasharray` + `stroke-dashoffset` (efecto "draw-on-scroll"). SIEMPRE respetar `prefers-reduced-motion`.
- Path data limpio — sin exceso de nodos. Preferible Hand-tuned o Illustrator → SVG export → optimizado con SVGO.

### Ubicación técnica
```
components/illustrations/
├── HeroCastle.tsx              # hero del home
├── dividers/
│   ├── Flourish.tsx
│   └── SigilRule.tsx
├── ornaments/
│   ├── CornerCurl.tsx
│   └── StarCluster.tsx
└── backgrounds/
    └── Constellation.tsx       # opcional, sutil
```

### Integración con design system
- Stroke weight + linecap/linejoin se documentan en `docs/design-system.md` §"Ilustración".
- Color via `currentColor` para que las mismas ilustraciones funcionen en dark/light.
- Tamaño responsive (`width: 100%`, `height: auto`, viewBox preserva aspect).

## Alternativas consideradas
| Alternativa | Por qué se descarta |
|---|---|
| **Photography / imágenes de la API** | La API no retorna imágenes. Stock photos rompen el tono. |
| **3D renders / WebGL** | Overkill, fuera de scope. Incompatible con Excalibur 2D. |
| **Ilustración con fills y sombreado** | Choca con line-art de icons (ADR-0015). Inconsistencia visual. |
| **Sin ilustración** | Pierde oportunidad de marca. Hero se ve vacío o cae en CTA template. |
| **Lottie / animaciones complejas** | Maintenimiento alto, riesgo de "AI-motion default". Límite a draw-on-scroll sutil. |

## Trade-offs aceptados

1. **Requiere ilustración real.** Hand-tuning de paths no es trivial.
   - **Mitigación:** cap scope v1 a 1 hero + 4 ornamentos. Primera iteración en Figma/Illustrator antes de exportar. Reutilizar ornamentos en múltiples páginas.
2. **Riesgo de inconsistencia con icons (ADR-0015).** Si los weights difieren, se nota.
   - **Mitigación:** mismas reglas de stroke (1-1.5), linecap round. QA visual en PR.
3. **Hero line-art grande puede pesar.** SVG complejo = KBs extra.
   - **Mitigación:** SVGO optimize + lazy-load en hero (cargar después de LCP inicial si compite con texto). Trackear peso en Lighthouse.
4. **Animación draw-on-scroll puede ser distractora.**
   - **Mitigación:** solo en hero, una vez al cargar. Nunca en ornamentos recurrentes.

## Consecuencias
- **Positivas:**
  - Refuerza Moonlit Armor con textura visual única.
  - Material narrativo fuerte para presentación ("diseñamos ilustración a medida, no usamos stock").
  - Coherencia total con icons (mismo stroke philosophy).
  - Fácil de tematizar (currentColor).
- **Negativas:**
  - Costo de producción real (horas de ilustración).
  - Riesgo de over-decorating si no se respeta el cap.
- **Acciones derivadas:**
  - Documentar stroke conventions en `docs/design-system.md` §"Ilustración".
  - Crear 1 hero + 4 ornamentos como mínimo antes del deploy de v1.
  - Setup SVGO en build pipeline para optimizar SVGs automáticamente.

## Notas
- Referencias canónicas: Mapa del Merodeador (HP films); grabados alquímicos de Athanasius Kircher (s. XVII); astrolabios planisféricos; blueprints góticos (Eugène Viollet-le-Duc).
- SVGO: https://github.com/svg/svgo
- Animación SVG draw-on-scroll: técnica de Jake Archibald (https://jakearchibald.com/2013/animated-line-drawing-svg/).
