# ADR-0025: Taxonomía v1.2 — eventos del Potions game (extiende ADR-0007)

- **Estado:** Aceptado
- **Fecha:** 2026-07-28
- **Decisor(es):** kerty + arquitecto
- **Extiende:** [ADR-0007](./0007-event-taxonomy.md) (catálogo v1.1 → v1.2)
- **Relacionado:** [ADR-0018](./0018-fanclub-joined-event.md) (catálogo v1.1), [ADR-0023](./0023-potions-game-design.md) (reglas del juego), [ADR-0019](./0019-propiedad-platform-event-property.md) (`platform` común a todos los eventos)

## Contexto

ADR-0023 definió la mecánica del Potions game: 4 estados (`IDLE` / `PLAYING` / `WON` / `LOST`), sin redención, score persistente. El catálogo actual (ADR-0007 v1 + ADR-0018 = v1.1) cubre **8 eventos** del flujo Houses + Fanclub Joined.

Para la fase 2 del challenge necesitamos trackear:

1. **Winrate** — ratio `Potion Game Won` / (`Potion Game Won` + `Potion Game Lost`) por poción.
2. **Position bias** — distribución de clicks por `cardIndex` (¿la gente tiende a cliquear más el centro? ¿la izquierda?).
3. **Drop-off por round** — en qué round se cae más gente.
4. **Distribución de duración** — `durationSec` de partidas ganadas.
5. **Retención** — cuántas partidas jugadas por usuario (anónimo o conocido).

ADR-0007 §"Análisis futuros" mencionaba 3 eventos v2 pero eran para el módulo Wizards/Buscador, no aplican acá. Este ADR crea **5 eventos nuevos específicos del Potions game**, sin tocar los v2 planificados.

## Decisión

**Agregar 5 eventos al catálogo v1.2 de ADR-0007.**

### Catálogo v1.2 = v1.1 + 5 eventos Potions

```ts
// Eventos nuevos — ADR-0025
export interface PotionGameStartedProperties {
  potionId: string;
  potionName: string;
  recipeSize: number; // cantidad de ingredientes totales = cantidad de rounds
}

export interface PotionRoundPlayedProperties {
  potionId: string;
  round: number; // 1-indexed
  cardIndex: 0 | 1 | 2; // posición de la card clickeada (0 = izq, 1 = centro, 2 = der)
  correct: boolean;
}

export interface PotionGameWonProperties {
  potionId: string;
  potionName: string;
  roundsCompleted: number;
  durationSec: number; // tiempo total desde Started hasta Won
}

export interface PotionGameLostProperties {
  potionId: string;
  potionName: string;
  round: number; // round en el que se perdió (1-indexed)
  failedCardIndex: 0 | 1 | 2;
}

export interface PotionGameRestartedProperties {
  previousPotionId: string;
  previousOutcome: "won" | "lost";
}
```

### Mapa de eventos → transiciones de estado (ADR-0023)

```
IDLE ──Potion Game Started──► PLAYING
                                │
                                ├──Potion Round Played (correct=true)──► PLAYING (round N+1)
                                │                                          │
                                │                                          └──Potion Game Won──► WON
                                │
                                └──Potion Round Played (correct=false)──► LOST
                                                                            │
                                                                            └──Potion Game Lost
WON ┐
    ├──Potion Game Restarted──► IDLE (con nueva poción random)
LOST┘
```

### Convenciones preservadas (ADR-0007)

- **Nombres**: Title Case, verbo en pasado (`Potion Game Started`, no `potion_started` ni `StartPotion`).
- **Props**: camelCase, ASCII.
- **Enums**: `cardIndex` es numérico (0/1/2) para facilitar agregaciones. No usamos `'left' | 'center' | 'right'` porque rompe el ordenamiento natural en dashboards.
- **Sin PII**: ninguna prop expone info del usuario. `potionId`/`potionName` son del catálogo HP, no del usuario.

### Resto del catálogo v1.1

**Sin cambios.** Los 8 eventos existentes (`Page Viewed` auto, `House Viewed`, `House Card Clicked`, `Explore CTA Clicked`, `Back To Houses Clicked`, `External Link Clicked`, `Theme Toggled`, `Fanclub Joined`) siguen igual.

**v1.2 = v1.1 + 5 eventos Potions = 13 eventos totales.**

### Cobertura de `platform` (ADR-0019)

Como todos los eventos del catálogo, los 5 nuevos llevan automáticamente `platform` adjunta por el wrapper. Permite análisis cross-device del juego (¿mobile tiene peor winrate que desktop?).

## Alternativas consideradas

| Alternativa | Por qué se descarta |
|---|---|
| **Un solo evento `Potion Game Round Played` con outcome** | Pierde la diferenciación de "partida terminada" (Won/Lost). Las métricas winrate y drop-off serían más difíciles de computar. |
| **Trackear solo Won + Lost** (sin Round Played) | Pierde el análisis de position bias y drop-off por round. Es lo más valioso para presentar. |
| **Trackear también hover/focus** en cards | Demasiado ruido para el challenge. Postergado a v3 si analytics lo pide. |
| **Trackear tiempo por round** (no solo total) | Suma 1 prop más pero duplica información que se puede derivar de round timestamps. Postergado. |
| **`position: 'left'\|'center'\|'right'` en vez de `cardIndex: 0|1|2`** | Strings complican agregaciones (avg, std dev). Numérico es más limpio. |
| **`previousOutcome: 'won'\|'lost'\|'abandoned'`** (incluir abandono) | No hay forma de detectar abandono confiablemente en MVP (sin evento unload explícito). Solo won/lost por ahora. |
| **Pasar el `potionName` en `Potion Round Played`** | Redundante con `potionId`. Joined por `potionId` ya da el name. Ahorra bytes. |

## Consecuencias

- **Positivas:**
  - Métricas pedidas por el user son computables:
    - **Winrate**: `Potion Game Won` / (`Potion Game Won` + `Potion Game Lost`) agrupado por `potionName`.
    - **Position bias**: `Potion Round Played` agrupado por `cardIndex`, métrica totals.
    - **Drop-off por round**: `Potion Game Lost` agrupado por `round`.
  - Catálogo sigue siendo finito y versionado → presentable.
  - Cobertura cross-evento de `platform` permite análisis device-aware.
- **Negativas:**
  - 5 eventos más para mantener en el wrapper tipado.
  - Riesgo de PII en `potionName` (no aplica — son nombres canónicos HP).
- **Riesgos / mitigaciones:**
  - **Evento `Potion Round Played` puede ser muy ruidoso** (1+ por round, vs 1 Started/Won/Lost por partida). Mitigación: en el wrapper el evento es explícito; si el dashboard se satura, se filtra por `correct=false` para análisis focalizado.
  - **`durationSec` con clock skew** entre Started y Won. Mitigación: medir con `Date.now()` en el client, no desde servidor.
- **Acciones derivadas:**
  - Actualizar `lib/analytics/events.ts` con las 5 nuevas interfaces.
  - Actualizar `EventCatalog` type.
  - Agregar 5 funciones `trackPotion*` en `lib/analytics/index.ts`.
  - Linkear este ADR desde ADR-0007 §"Análisis futuros".

## Métricas de analytics que habilita

1. **Winrate por poción** — Event Segmentation: `Potion Game Won` / (`Potion Game Won` + `Potion Game Lost`), group by `potionName`.
2. **Position bias** — `Potion Round Played` group by `cardIndex` (totals). Hipótesis: el centro (index 1) recibe más clicks incorrectos por "centro bias".
3. **Drop-off por round** — Funnel: Started → Round 1 Played → Round 2 Played → ... → Won. O `Potion Game Lost` group by `round`.
4. **Distribución de duración** — `Potion Game Won` aggregate by `durationSec` (avg, p50, p90).
5. **Retención** — `Potion Game Started` per unique user_id/device_id.

## Notas

- v1.1 → v1.2 es incremental. No rompe dashboards existentes.
- Los 3 eventos v2 planificados en ADR-0007 (Wizard Search, etc.) quedan fuera de scope hasta que exista el módulo Wizards.
- Si v3 trima eventos (p.ej. remover `Potion Game Restarted` si no aporta valor), se hace vía ADR sucesor marcando el evento como deprecated, no silenciosamente.
