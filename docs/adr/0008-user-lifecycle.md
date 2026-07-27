# ADR-0008: User lifecycle — anónimo → conocido

- **Estado:** Aceptado
- **Fecha:** 2026-07-27
- **Decisor(es):** kerty + arquitecto
- **Relacionado:** ADR-0006 (wrapper), ADR-0007 (taxonomy), AMP-003

## Contexto
El challenge pide explicar "Anonymous users x known users (User lifecycle)" en la presentación. Necesitamos un mecanismo concreto para transicionar usuarios de anónimos a conocidos, persistente, sin construir auth real (fuera de scope).

Modelo de identidad de Amplitude:
- **`device_id`** — generado automáticamente por el SDK, persistente en localStorage. Identifica al usuario anónimo.
- **`user_id`** — seteado por la app cuando el usuario se identifica. Al llamar `setUserId(...)`, Amplitude **mergea** el histórico de eventos anónimos (asociados al `device_id`) con el nuevo perfil de `user_id`.

## Decisión

### Formulario "Únete al fanclub"
Un formulario simple (sin backend, sin password, sin verificación de email en v1) con 3 campos:

| Campo | Destino |
|---|---|
| **Email** | → `setUserId(<email normalizado lowercase>)` (sirve como stable identifier y permite login futuro). |
| **Nombre de mago** (display name) | → user property `wizardName`. |
| **Casa favorita** (select: Gryffindor/Slytherin/Ravenclaw/Hufflepuff) | → user property `favoriteHouse`. |

Al enviar el form:
1. Llamar `analytics.identifyFanclubMember({ email, wizardName, favoriteHouse })`.
2. El wrapper internamente:
   - Normaliza email (trim + lowercase).
   - Llama `amplitude.setUserId(email)`.
   - Construye `Identify` con `wizardName`, `favoriteHouse` y `lifecycleStage: 'known'`.
   - Llama `amplitude.identify(...)`.
3. Disparar evento `Fanclub Joined` con props: `favoriteHouse`, `wizardNameLength` (no el nombre — minimizar PII en events). *(agregar a ADR-0007 v1.1 si se implementa ya; si no, v2.)*

### Estados
```
[Visitante anónimo]
   device_id (auto) → todos los events llevan device_id
   lifecycleStage = 'anonymous'
        │
        │ completa "Únete al fanclub"
        ▼
[Usuario conocido]
   user_id = email
   user properties: wizardName, favoriteHouse, lifecycleStage='known'
   Histórico anónimo mergeado por Amplitude.
```

### Logout (no implementado en v1, documentado)
- `amplitude.setUserId(null)`.
- `amplitude.regenerateDeviceId()`.
- Reset `lifecycleStage = 'anonymous'`.

## Alternativas consideradas
| Alternativa | Por qué se descarta |
|---|---|
| **Auth real (NextAuth, Auth.js, email magic link)** | Scope creep. No hay backend, no hay necesidad. Demora el minimal. |
| **Generar user_id aleatorio sin email** | Perdés la semántica de "conocido" y la narrativa del lifecycle. Email es el identificador más didáctico para presentar. |
| **Login social (Google, GitHub)** | Overkill; añade complejidad OAuth y dependencia externa. |
| **No hacer form, lifecycle solo conceptual** | Pierde el efecto demostración. La narrativa "ven cómo un usuario pasa de anónimo a conocido" es uno de los pilares de la presentación. |

## Consecuencias
- **Positivas:**
  - Demostración tangible del user lifecycle anónimo → conocido.
  - `favoriteHouse` como user property habilita el análisis cruzado "wizards más buscados por casa favorita" (ver ADR-0007 §Análisis futuros #2).
  - Sin infraestructura de auth → se mantiene el minimal.
- **Negativas / Riesgos:**
  - **PII:** el email se persiste en Amplitude como `user_id`. Para un challenge controlado es acceptable; en producción real se hashearía o se usaría un ID interno.
  - **Sin verificación:** cualquier email es "válido". Aceptado para el demo.
  - **Identidad múltiple en mismo dispositivo:** si dos personas usan el mismo browser, la segunda sobreescribe al primero. Mitigación: botón "logout" (reset identity) documentado pero fuera de v1.
  - **Merge irreversible:** una vez que dos `device_id`s se asocian al mismo `user_id`, Amplitude los mergea. No es reversible desde la UI. Aceptado para scope.
- **Mitigaciones generales:**
  - Documentar en README las consideraciones de PII.
  - Sanitizar `wizardName` (longitud máx 50, sin HTML).
  - `lifecycleStage` como prop permite segmentar en dashboards sin exponer emails.

## Consecuencias para el dashboard de presentación
Habilita estas vistas:
- Distribución de usuarios por `favoriteHouse`.
- Comparativa engagement `anonymous` vs `known`.
- *(v2)* Cross-analysis wizards más vistos por `favoriteHouse`.

## Notas
- Doc identidad: https://amplitude.com/docs/data/user-properties-and-event-properties
- `setUserId` + `regenerateDeviceId`: https://amplitude.com/docs/sdks/analytics/browser/browser-sdk-1#setUserId
- Sin dependencia de servicios externos; el "login" es pura instrumentación de identidad en Amplitude.
