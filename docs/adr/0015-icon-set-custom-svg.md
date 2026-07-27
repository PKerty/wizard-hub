# ADR-0015: Icon set — custom SVG heráldico/esotérico

- **Estado:** Aceptado
- **Fecha:** 2026-07-27
- **Decisor(es):** kerty + arquitecto
- **Relacionado:** ADR-0013 (visual identity), ADR-0016 (line-art), DESIGN-003

## Contexto
Necesitamos iconos para:
- **UI funcional:** chevrons, close, search, theme toggle, arrow, menu.
- **Heraldia de casas:** los 4 escudos (león, serpiente, águila, tejón) — no existen en libraries.
- **Sigilos / ornamentos esotéricos:** decoración estructural y elementos del signature.

La identidad "Moonlit Armor" (ADR-0013) rechaza explícitamente el "default AI look". Heroicons, lucide y phosphor son excellentes pero genéricos — usarlos contradice el brief.

## Decisión
**Construir un set custom de SVGs.** Sin dependencia de librería de iconos.

### Estructura
```
components/icons/
├── ui/                  # iconos funcionales
│   ├── chevron.svg
│   ├── close.svg
│   ├── search.svg
│   ├── arrow-right.svg
│   ├── menu.svg
│   └── theme-toggle.svg
├── houses/              # escudos de las 4 casas (heraldia canónica)
│   ├── gryffindor.svg   # león rampant
│   ├── slytherin.svg    # serpentine serpent
│   ├── ravenclaw.svg    # eagle displayed
│   └── hufflepuff.svg   # badger sejant
├── sigils/              # ornamentos esotéricos
│   ├── alchemical/      # mercurio, azufre, sal, etc.
│   ├── celestial/       # luna fases, estrellas, planetas
│   └── dividers/        # flourishes para secciones
└── Icon.tsx             # wrapper React (props: name, size, className)
```

### Convenciones del set
- **Stroke-based, no fill** (alinea con line-art, ADR-0016).
- `stroke-width: 1.5` uniforme en UI icons; `2` en house shields (más presenciales).
- `viewBox="0 0 24 24"` para UI; `0 0 48 48` para shields.
- Color heredado via `stroke="currentColor"` (Tailwind `text-steel` / `text-torchlight`).
- Variantes de tamaño: `sm=16`, `md=20`, `lg=24`, `xl=32` (Tailwind `size-*`).

### Componente wrapper
```tsx
// components/icons/Icon.tsx
type IconName = 'ui/chevron' | 'ui/close' | 'houses/gryffindor' | ...;
type IconProps = { name: IconName; size?: 'sm'|'md'|'lg'|'xl'; className?: string };
```
Carga vía `next/dynamic` o imports estáticos. Decisión técnica en scaffold.

## Alternativas consideradas
| Alternativa | Por qué se descarta |
|---|---|
| **heroicons** | Default Tailwind. Genérico. Traiciona "no default look". |
| **lucide-react** | Set enorme pero genérico. SVG aesthetic "feather-like". |
| **phosphor-icons** | Múltiples pesos interesantes, pero still library aesthetic. |
| **Iconify (mega-aggregator)** | Flexible, pero trae miles de estilos inconsistentes. Difícil unificar. |
| **Font Awesome / Material Icons** | Cliché corporativo. Incompatible con "esotérico". |

## Trade-offs aceptados

1. **Más trabajo upfront** para producir ~15-25 SVGs.
   - **Mitigación:** empezar con el mínimo viable para v1 (UI esenciales + 4 escudos = ~10). Sigilos se incorporan cuando los necesitemos.
2. **Mantenimiento del set** (consistencia de stroke, viewBox, alineación óptica).
   - **Mitigación:** revisión visual en cada PR que agregue icono; convenciones documentadas arriba.
3. **House shields requieren ilustración heraldia correcta.** Si quedan mal, rompen el efecto.
   - **Mitigación:** reference de blasones reales (Parker's Glossary of Heraldry); primer iteración en Figma antes de exportar.

## Consecuencias
- **Positivas:**
  - Sin dependencia externa de icons (un vendor menos).
  - Estética 100% alineada con Moonlit Armor.
  - House shields verdaderamente canónicos (no aproximaciones).
  - Bundle solo incluye lo que se usa (imports explícitos).
- **Negativas:**
  - SVGs consumen tiempo de diseño que no va a features.
  - Riesgo de inconsistencia visual si convenciones se relajan.
- **Acciones derivadas:**
  - Definir proceso de QA visual para SVGs nuevos (PR con screenshot).
  - Documentar el catálogo en `docs/design-system.md` §"Iconografía" (actualizar).

## Notas
- Inspiración heráldica: Arthur Charles Fox-Davies, *A Complete Guide to Heraldry* (1909) — dominio público, disponible en archive.org.
- Convención stroke-based: alinea con line-art (ADR-0016 futuro).
- SVG inline vs `<img>`: preferir inline para poder animar/stylize via CSS.
