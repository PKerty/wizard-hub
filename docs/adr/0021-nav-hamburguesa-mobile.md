# ADR-0021: Nav hamburguesa en mobile (reemplaza parte de ADR-0020 §2)

- **Estado:** Aceptado
- **Fecha:** 2026-07-28
- **Decisor(es):** kerty + arquitecto
- **Reemplaza (parcialmente):** [ADR-0020](./0020-estrategia-responsive.md) §2 "Nav móvil — estrategia 'condensar, no hamburguesa'"
- **Relacionado:** [ADR-0013](./0013-visual-identity.md) (identidad visual), [ADR-0007](./0007-event-taxonomy.md) (eventos del nav)

## Contexto

ADR-0020 §2 descartó la hamburguesa a favor de "condensar" (ocultar `Home` explícito en mobile porque el brand ya linka a `/`). La auditoría visual post-implementación (PR #10) mostró que **no alcanza**: en viewports `<400px` el brand `wizard-hub` con `text-eyebrow` + `tracking-[0.25em]` + `uppercase` se parte en dos líneas, compitiendo con `Houses` + `Join`/`Sign Out` + `ThemeToggle`.

El propio ADR-0020 ya lo anticipaba como riesgo:

> **Heurística "condensar" puede no alcanzar** en <360px. Mitigación: testear con iPhone SE (375px) y Galaxy Fold (280px); si rompe, abrir ADR-0021 con hamburguesa.

Las opciones CSS-only (achicar brand, reducir tracking en mobile) son parches frágiles que vuelven a romper si el nav crece ( Wizards v2).

## Decisión

**Reemplazar la estrategia "condensar" del ADR-0020 §2 por una hamburguesa con drawer lateral derecho en `< sm`.**

### Comportamiento

- **`< sm` (mobile)**: botón hamburguesa a la derecha del brand (junto a `ThemeToggle`). Al click, abre un drawer que ocupa el ancho del viewport con overlay translúcido detrás. Contiene los links `Home`, `Houses`, `Join`/`Sign Out`.
- **`≥ sm` (desktop/tablet)**: comportamiento inline actual (sin cambios respecto al PR #10).

### Cierre del drawer

1. Click en cualquier link interno.
2. Click en el overlay.
3. Tecla `Escape`.
4. Cambio de ruta (follow-up del link click).

### Accesibilidad

- Botón con `aria-expanded`, `aria-controls`, `aria-label="Open menu"`/`"Close menu"`.
- Drawer con `role="dialog"` + `aria-modal="true"` + `aria-label`.
- `Escape` cierra y devuelve foco al botón hamburguesa.
- Focus trap básico: al abrir, foco va al primer link; `Tab` no sale del drawer mientras esté abierto.

### SSR safety

El botón hamburguesa se renderiza siempre (HTML estático), pero el drawer arranca cerrado. Sin efectos de layout en SSR.

### Eventos de analytics

Sin cambios respecto al ADR-0007: los links del drawer disparan los mismos eventos que los links desktop (`Explore CTA Clicked` con `location: 'nav'`, etc.). No se agregan eventos `Mobile Menu Opened` ni similares — serían ruido para el scope del challenge.

### Implementación

- Componente nuevo: `components/layout/mobile-nav.tsx` ("use client").
- Tests nuevos: `components/layout/mobile-nav.test.tsx` (toggle, cierre por link/overlay/escape, aria attributes).
- `Nav.tsx` se modifica para renderizar `MobileNav` en `< sm` y los links inline en `≥ sm`.

## Alternativas consideradas

| Alternativa | Por qué se descarta |
|---|---|
| **CSS-only: achicar brand en mobile** | Parche frágil. Rompe en `<360px` o cuando el nav crezca ( Wizards v2). No resuelve raíz. |
| **Dropdown menu (vertical desde el botón)** | Drop-down tapa contenido y es menos estándar para nav principal mobile. Drawer con overlay es más claro. |
| **Bottom navigation bar** | Patrón para apps con 5+ secciones principales. Overkill para 3 links. |
| **Mantener "condensar" y aceptar brand wrap** | Anti-profesional para la presentación del challenge. |

## Consecuencias

- **Positivas:**
  - Resuelve el problema raíz del header mobile.
  - Escala: agregar links en el futuro ( Wizards v2) no rompe el layout.
  - Cumple WCAG 2.4.3 (Focus Order) y 4.1.2 (Name, Role, Value).
- **Negativas:**
  - ~200 LoC nuevos (componente + tests).
  - Estado client-side en el header (era stateless antes). Mitigación: estado local aislado en el componente `MobileNav`, no afecta al resto del chrome.
- **Riesgos / mitigaciones:**
  - **FOUC del drawer en SSR**: drawer arranca cerrado (`hidden`), sin animación hasta hidratar. Mitigación: CSS `display: none` inicial vía class condicional.
  - **Scroll lock del body mientras drawer abierto**: implementar con `document.body.style.overflow = 'hidden'` en effect. Limpiar en cleanup.
- **Acciones derivadas:**
  - Migrar `components/layout/nav.tsx` para usar `MobileNav` en `< sm`.
  - Actualizar ADR-0020 §2 marcando que fue reemplazado por este ADR para nav mobile.

## Notas

- WCAG dialog pattern: <https://www.w3.org/WAI/ARIA/apg/patterns/dialogmodal/>
- Inspiración de drawer: shadcn/ui Sheet (sin adoptar la dep — implementación ad-hoc con Tailwind).
