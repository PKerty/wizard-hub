# ADR-0003: Adoptar TypeScript como lenguaje principal

- **Estado:** Aceptado
- **Fecha:** 2026-07-27
- **Decisor(es):** kerty + arquitecto
- **Relacionado:** ADR-0002 (Next.js), STACK-002

## Contexto
Next.js soporta TS y JS. La Wizard World API devuelve JSON tipable (House con `id`, `name`, `houseColours`, `founder`, `animal`, `element`, `ghost`, `commonRoom`, `members[]`, etc.). Necesitamos decidir tipado para todo el proyecto.

## Decisión
Usar **TypeScript** en modo `strict` en todo el repo (`tsconfig.json` con `"strict": true`).

## Alternativas consideradas
- **JavaScript puro:** más rápido de arrancar, pero perdemos autocompletado y validación del shape de la API. Para un proyecto que va a crecer incrementalmente y tiene una presentación final, el costo de TS lo pagamos en 1 setup y el beneficio se sostiene.

## Consecuencias
- **Positivas:** tipo de datos de la API verificado en compile time; refactor seguro; mejores DX y errores en CI antes que en runtime.
- **Negativas:** fricción inicial de configuración y un poco más de boilerplate.
- **Acciones:**
  - Generar tipos desde el schema de la API (manual o vía OpenAPI si existe).
  - `tsc --noEmit` como gate en CI (cuando exista) — ver ADR futuro QA-001.
