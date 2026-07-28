# ADR-0018: Extender taxonomy con `Fanclub Joined` (extiende ADR-0007 a v1.1)

- **Estado:** Aceptado
- **Fecha:** 2026-07-27
- **Decisor(es):** kerty + arquitecto
- **Extiende:** [ADR-0007](./0007-event-taxonomy.md) (catálogo v1 → v1.1)
- **Relacionado:** [ADR-0008](./0008-user-lifecycle.md) (user lifecycle — el form que dispara este evento)

## Contexto
ADR-0008 especifica que el formulario "Únete al fanclub" debe, al enviar:

1. Llamar `setUserId(email)` + `identify({ lifecycleStage, wizardName, favoriteHouse })`.
2. **Disparar un evento `Fanclub Joined`** con props: `favoriteHouse`, `wizardNameLength` (no el nombre — minimizar PII).

ADR-0007 catálogo v1 **no incluía** `Fanclub Joined`. La propia ADR-0008 lo notaba:
> *(agregar a ADR-0007 v1.1 si se implementa ya; si no, v2.)*

Como PR 005 implementa el form, necesitamos formalizar el evento en el catálogo.

## Decisión
**Agregar `Fanclub Joined` al catálogo v1.1 de ADR-0007.**

```ts
export interface FanclubJoinedProperties {
  favoriteHouse: "gryffindor" | "slytherin" | "ravenclaw" | "hufflepuff";
  wizardNameLength: number; // longitud, no el nombre — minimizar PII
}
```

### Convenciones preservadas
- Nombre: Title Case, verbo en pasado (`Fanclub Joined`).
- Props: camelCase.
- Enum values: snake_case libre, pero los houses ya son lowercase por consistencia con ADR-0008.

### Resto del catálogo v1
**Sin cambios.** Los 7 eventos originales siguen igual:
`Page Viewed` (auto), `House Viewed`, `House Card Clicked`, `Explore CTA Clicked`, `Back To Houses Clicked`, `External Link Clicked`, `Theme Toggled`.

**v1.1 = v1 + `Fanclub Joined` (8 eventos totales).**

## Alternativas consideradas
| Alternativa | Por qué se descarta |
|---|---|
| **No trackear, sólo identify** | Pierde el evento de conversión "se unió". El dashboard no puede medir funnel de unión. |
| **Reusar `Explore CTA Clicked` con location 'form'** | Diferente semántica:探索ar vs unirse. Mezcla métricas. |
| **Trackear con el nombre real del wizard** | PII innecesario en events. Con `wizardNameLength` alcanza para análisis (largo promedio, distribuciones). |

## Consecuencias
- **Positivas:**
  - Conversión trackeable: funnel `Explore CTA → /join view → Fanclub Joined`.
  - Cohortes por `favoriteHouse` (casa elegida al unirse) cruzadas con navegación posterior.
  - Cumple requirement del challenge: "al menos 5 interacciones" → ahora **7 eventos** en v1.1.
- **Negativas:**
  - Un evento más para mantener.
- **Acciones derivadas:**
  - Actualizar `lib/analytics/events.ts` para incluir `Fanclub Joined`.
  - Agregar `trackFanclubJoined` a `lib/analytics/index.ts`.
  - Actualizar `EventCatalog` type (es la fuente única, así que se propaga automáticamente).

## Notas
- Este ADR **no modifica** los 7 eventos originales de v1. Solo agrega.
- Cuando se implemente v2 ( Wizards + Search), los eventos adicionales vivirán en otro ADR (`0019-search-v2` o similar).
