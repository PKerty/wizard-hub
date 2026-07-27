# ADR-0010: Diagramas — Mermaid en el repo

- **Estado:** Aceptado
- **Fecha:** 2026-07-27
- **Decisor(es):** kerty + arquitecto
- **Relacionado:** DIAG-001

## Contexto
El challenge pide dos entregables de diseño: **HLD** (High Level Diagram) y **LLD** (Low Level Diagram). Necesitamos elegir notación + herramienta.

## Decisión
Usar **Mermaid** para todos los diagramas, versionados como `.md` con bloques de código ` ```mermaid ` dentro del repo en `docs/diagrams/`.

```
docs/diagrams/
├── hld.md           # High Level Diagram (system context + componentes)
├── lld-*.md         # Low Level: por componente o flujo (p.ej. lld-house-detail.md)
└── README.md        # índice + cómo renderizar
```

### Alcance mínimo de diagramas
| Diagrama | Contenido |
|---|---|
| `hld.md` | Usuario → Vercel/Next.js → Wizard World API; bloques de Amplitude, Data Cache. |
| `lld-house-detail.md` | Secuencia: browser → App Router → use case → port → adapter → API; eventos de Amplitude. |
| `lld-amplitude-flow.md` (futuro) | Diagrama de secuencia del lifecycle anónimo → conocido (ADR-0008). |

### Renderizado
- **Local:** extensión "Markdown Preview Mermaid Support" (VS Code) o `mermaid-cli` (`mmdc`).
- **GitHub:** Mermaid se renderiza nativo en PRs y `.md` files desde 2022.
- **Presentación:** exportar a SVG/PNG con `mmdc` para incluir en el deck.

## Alternativas consideradas
| Alternativa | Por qué se descarta |
|---|---|
| **Excalidraw** | Excelente para hand-drawn visuals pero rompe el "diagram as code": el `.excalidraw` es opaco, no se diff-a limpio en PRs, y duplicar el source en el repo pesa. |
| **PlantUML** | Más verboso, requiere Java o servidor público para render. Mermaid tiene mejor DX en GitHub. |
| **draw.io / Lucidchart** | Solo visuales, sin versionado significativo. |
| **Diagrams.com (Structurizr)** | Overkill; pensado para C4 completo. |

## Consecuencias
- **Positivas:**
  - Diagramas viven con el código y se revisan en PR.
  - GitHub render nativo → cero fricción para que un revisor los vea.
  - Fácil de exportar a imágenes para el deck de presentación.
- **Negativas:**
  - Mermaid tiene menos flexibilidad estética que Excalidraw.
  - Algunos layouts complejos son difíciles de exprimir (especialmente sequence diagrams muy largos).
- **Mitigaciones:**
  - Mantener diagramas chicos y enfocados (uno por flujo, no mega-diagramas).
  - Si surge necesidad de diagrama visual muy custom, se permite Excalidraw **como complemento** (no reemplazo) en `docs/diagrams/assets/`.

## Notas
- Sintaxis: https://mermaid.js.org/intro/
- GitHub support: https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams
