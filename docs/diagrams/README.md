# Diagramas — wizard-hub

Diagramas en Mermaid del sistema. Cumplen el entregable HLD + LLD del challenge (ver [ADR-0010](../adr/0010-diagramas-mermaid.md)).

## Índice

| Diagrama | Tipo | Qué muestra |
|---|---|---|
| [`hld.md`](./hld.md) | System context + componentes | Vista global: usuario → Vercel/Next.js → Wizard World API + Amplitude. |
| [`lld-house-detail.md`](./lld-house-detail.md) | Secuencia | Request `/houses/[id]` end-to-end: browser → App Router → use case → adapter → API; ISR cache; evento `House Viewed`. |
| [`lld-amplitude-flow.md`](./lld-amplitude-flow.md) | Estado + secuencia | User lifecycle anónimo → conocido (ADR-0008), eventos y propiedades en cada transición. |

## Cómo verlos

- **GitHub**: render nativo en el preview del archivo `.md` o en PRs.
- **VS Code**: extensión *Markdown Preview Mermaid Support*.
- **CLI**: `npx mmdc -i hld.md -o hld.svg` (requiere `@mermaid-js/mermaid-cli`).

## Convenciones

- Un diagrama = un flujo o vista. Mantener chicos y enfocados.
- Nombres de archivos: `hld.md` para high-level; `lld-<flujo>.md` para low-level.
- Tipos Mermaid usados: `flowchart` (HLD), `sequenceDiagram` (LLD secuencia), `stateDiagram-v2` (lifecycle).
