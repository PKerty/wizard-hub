# ADR-0001: Adoptar Architecture Decision Records (ADRs)

- **Estado:** Aceptado
- **Fecha:** 2026-07-27
- **Decisor(es):** Sesión inicial (kerty + arquitecto)

## Contexto
El challenge pide articular y defender decisiones arquitectónicas en una fase de presentación. Además, el desarrollo será incremental ("minimal primero, luego construir encima"), por lo que las decisiones tomadas al inicio pueden ser cuestionadas o reemplazadas más adelante. Necesitamos un mecanismo liviano, versionado y navegable que:

- Registre **qué** se decidió.
- Registre **por qué** (contexto y alternativas).
- Permita **reabrir** la decisión si cambian las premisas.
- Sea fácil de incluir en la presentación final.

## Decisión
Adoptar **Architecture Decision Records (ADRs)** en formato Michael Nygard, almacenados como archivos Markdown numerados en `docs/adr/`.

Reglas:
- Un ADR por decisión atómica.
- Numeración secuencial y monótona (no se reutiliza un número).
- El nombre del archivo es `NNNN-kebab-case-title.md`.
- Una vez **Aceptado**, un ADR no se edita para cambiar la decisión: se crea uno nuevo que lo **Reemplaza** o **Desestima**.
- El primer ADR de un área técnica define el marco; los siguientes refinan o reemplazan.
- Toda decisión "significativa" (stack, patrones de integración con Amplitude, estrategia de hosting, organización del repo, etc.) debe documentarse como ADR **antes o durante** su implementación.

## Alternativas consideradas
- **Notas sueltas en el README:** descartado por mezclar contexto con decisiones y dificultar el histórico.
- **Issue tracker (GitHub Issues/Linear):** útil para discusión, pero no conserva bien la estructura de "decisión final + consecuencias". Se usará para discusión previa; el outcome vivirá como ADR.
- **Wiki / Notion externos:** descartado para mantener las decisiones cerca del código y versionadas con git.

## Consecuencias
- **Positivas:** Trazabilidad, insumo directo para la presentación, menor re-trabajo por desalineación.
- **Negativas:** Overhead de redacción por decisión. Mitigado por template corto (`0000-template.md`) y regla de "solo decisiones significativas".
- **Riesgos:** ADRs obsoletos si se cambia código sin actualizarlos. Mitigado: el `AGENTS.md` exige verificar ADRs relevantes antes de editar áreas cubiertas por ellos.

## Notas
- Template: `docs/adr/0000-template.md`.
- Índice navegable: ver sección "ADRs" en `AGENTS.md`.
