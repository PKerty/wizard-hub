# ADR-0002: Adoptar Next.js como framework frontend/fullstack

- **Estado:** Aceptado
- **Fecha:** 2026-07-27
- **Decisor(es):** kerty + arquitecto
- **Reemplaza:** —
- **Relacionado:** STACK-002 (tipado), STACK-003 (data fetching), HOST-001 (hosting)

## Contexto

Necesitamos elegir el framework principal para `wizard-hub`. Requisitos del challenge:

- Consumir la Wizard World API (`/houses`, `/houses/:id`).
- Instrumentar Amplitude (page views + ≥5 eventos).
- Diagramas HLD/LLD, repo en GitHub, hosting deseable.
- Iterar rápido, scope acotado, presentación en fechas cortas.

Restricciones del equipo: priorizar simplicidad y velocidad sobre escalabilidad a largo plazo; el techo esperado de usuarios es bajo a moderado (fanclub + demo de challenge).

Las alternativas razonables eran Next.js, Remix, Astro, Vite+React (SPA), SvelteKit. Este ADR se centra en por qué Next.js y qué trade-offs aceptamos.

## Decisión

Adoptar **Next.js** (App Router, última versión estable) como framework único para frontend y capa de servidor de la aplicación.

Alcance inicial:
- Renderizado: por definirse en ADR-0003 (STACK-003) — candidatas a SSG/ISR para catálogo de casas.
- Capa de servidor limitada a: proxy a Wizard World API (si hace falta por CORS / cache), e inicialización de Amplitude desde el cliente.
- Deploy objetivo: Vercel (Hobby).

## Alternativas consideradas

| Alternativa | Por qué se descartó |
|---|---|
| **Remix** | Buen modelo de datos anidado, pero la integración con Amplitude y el ecosistema/tutoriales son menores que Next.js. No aporta ventaja decisiva para este scope. |
| **Astro** | Excelente para contenido estático (ideal para catálogo), pero su modelo de "islas" agrega fricción para interactividad tipo SPA y para tracking de Amplitude en navegaciones client-side. |
| **Vite + React (SPA)** | El más simple, pero perdemos SSR/SSG, routing basado en archivos y `next/image`. Para fanclub con SEO débil, sería suficiente — opción válida si Next.js empieza a pesar. |
| **SvelteKit** | Tecnicamente sólido, pero curva nueva para el equipo y menos ejemplos de integración con Amplitude. |

## Trade-offs (verificados contra docs oficiales y advisories a 2026-07-27)

### ✅ Ventajas

1. **Fullstack en una codebase** — frontend + Route Handlers en el mismo repo. Iteración muy rápida para scope corto.
2. **App Router + RSC** — manejo de datos del catálogo de casas con Server Components (sin spinner inicial si hacemos SSG/ISR).
3. **`next/image`** — optimización automática de imágenes del catálogo.
4. **File-based routing** — menos boilerplate para `/houses` y `/houses/[id]`.
5. **Ecosistema** — SDK oficial de Amplitude funciona, y hay ejemplos de integración para Next.js.
6. **Deploy en Vercel (Hobby, $0)** — push-to-deploy, preview por branch, dominio gratuito `.vercel.app`. Califica como uso personal/no-comercial.

### ⚠️ Trade-offs aceptados

1. **Acoplamiento con Vercel** (revisado contra `docs/self-hosting.mdx`):
   - Next.js **es** self-hostable: `next start`, build `standalone`, Docker, o `output: 'export'` (con limitaciones).
   - Sin embargo, optimizaciones como **ISR fluida**, **Edge Runtime**, **Image Optimization managed** y **Remote Build Cache** están pulidas para Vercel; en otro lado requieren configuración adicional o pérdida de features.
   - `output: 'export'` **no soporta** Server Actions, intercepting routes, ni el image optimizer por defecto (verificado en `next/src/export/index.ts`).
   - **Mitigación:** el scope del challenge (consumo de API pública, sin DB, sin auth) tiene acoplamiento mínimo. Si migráramos, objetivo viable: Node.js container en Fly.io/Railway, o adaptadores de Netlify/Cloudflare. Lo dejamos documentado para la presentación.

2. **Riesgo de "backend creep"** — Route Handlers/Server Actions cómodos → tentación de meter lógica de negocio pesada.
   - **Mitigación:** la capa de servidor se mantiene deliberadamente delgada (proxy + cache + nada más). Si se necesita lógica compleja, se extrae a servicio separado y se registra como nuevo ADR. Métrica de control: si un Route Handler excede ~50 líneas de lógica no trivial, disparar revisión.

3. **Cadencia de vulnerabilidades de seguridad** (revisado contra `vercel/next.js/security/advisories`):
   - Últimos advisories (a 2026-07-27): **9 publicados el 2026-07-21** (SSRF en Server Actions en custom server — `GHSA-89xv-2m56-2m9` High; SSRF en rewrites — `GHSA-p9j2-gv94-2wf4` High; bypass de middleware con Turbopack — `GHSA-6gpp-xcg3-4w24` High; DoS vía Server Actions — `GHSA-m99w-x7hq-7vfj` High; DoS en Image Optimization con SVGs — `GHSA-q8wf-6r8g-63ch` Moderate; cache confusion — `GHSA-68g3-v927-f742`, `GHSA-4633-3j49-mh5q` Moderate; etc.) + **1 el 2026-05-07** (bypass de middleware vía segment-prefetch — `GHSA-26hh-7cqf-hhc6` High).
   - La afirmación "problemas de seguridad semanales" **es consistente** con lo observado: hay releases batched (varios CVEs en una fecha) cada 1–3 meses, no exactamente uno por semana.
   - **Evaluación de impacto para wizard-hub:**
     - No hay auth, no hay datos sensibles, no hay uploads de usuario, no hay Server Actions con entrada controlada por usuario → los vectores más frecuentes (SSRF en Server Actions, bypass de middleware) **no aplican** a este scope.
     - Restan: cache confusion, DoS en Image Optimization (relevante si usamos `next/image` con URLs externas).
   - **Mitigaciones:**
     - Pin de versión fija en `package.json`, actualización consciente (no `latest`).
     - No habilitar Server Actions con entrada usuario-controlada.
     - Si usamos `next/image` con imágenes remotas, configurar `remotePatterns` estrictos y considerar `dangerouslyAllowSVG: false` (default).
     - Dependabot/Renovate activado para alertar CVEs.

4. **"Magia" del framework** — convenciones opacas (caché de fetch, comportamiento de `'use client'`) pueden sorprender.
   - **Mitigación:** documentar decisiones de render mode por ruta en ADR-0003.

## Consecuencias

- **Positivas:** velocidad de desarrollo alta, ecosistema amplio, deploy gratis, presentación sólida.
- **Negativas:** deuda técnica si el backend crece; dependencia de Vercel para mejor DX.
- **Acciones derivadas:**
  - Definir tipado (TS sí) → ADR-0003 (STACK-002).
  - Definir estrategia de data fetching/render mode → ADR-0004 (STACK-003).
  - Confirmar Vercel como hosting → ADR-0005 (HOST-001).
  - Configurar Dependabot y política de versiones.

## Notas

- Docs revisadas:
  - Self-hosting: https://nextjs.org/docs/app/building-your-application/deploying/self-hosting
  - Static exports limitations: `next/src/export/index.ts`
  - Security advisories: https://github.com/vercel/next.js/security/advisories
  - Vercel Hobby plan: https://vercel.com/docs/limits/usage-faq
- Métrica de dashboard Amplitude afectada: este stack soporta las 2 métricas requeridas (page views + eventos + propiedades de plataforma vía SDK).
