# ADR-0005: Estrategia de data fetching — SSG + ISR

- **Estado:** Aceptado
- **Fecha:** 2026-07-27
- **Decisor(es):** kerty + arquitecto
- **Relacionado:** ADR-0002 (Next.js), ADR-0004 (Vercel), STACK-003, AMP-001/002

## Contexto
Wizard World API expone un catálogo esencialmente estable: 4 casas (Gryffindor, Slytherin, Ravenclaw, Hufflepuff) con datos que rara vez cambian. Necesitamos definir el modo de render/data fetching por ruta en Next.js App Router.

Alternativas evaluadas: SSG puro, ISR, SSR dinámico, CSR. Resumen en la discusión previa al ADR (ver historial de sesión). SSR dinámico se descarta porque la API es pública y no depende del usuario; CSR se descarta como fuente primaria porque penaliza SEO y LCP, pero se usará para interacciones client-side.

## Decisión
Combinación **SSG + ISR** por ruta:

| Ruta | Modo | Configuración |
|---|---|---|
| `/` (home) | **SSG puro** | Sin fetch externo o `cache: 'force-cache'`. |
| `/houses` (listado) | **ISR** | `fetch(url, { next: { revalidate: 86400, tags: ['houses'] } })` — refresco cada 24h. |
| `/houses/[id]` (detalle) | **SSG + ISR** | `generateStaticParams()` enumera las 4 casas en build; mismo `revalidate` y `tags` que el listado. |

Detalles:
- Tag `houses` permite invalidación on-demand con `revalidateTag('houses')` si se agrega un endpoint webhook en el futuro (opcional, fuera de scope del challenge).
- Todos los fetches viven en **Server Components**; los Client Components solo para interacciones y tracking.
- Page views y eventos de Amplitude se disparan desde Client Components después de la hidratación (ver ADR futuro AMP-001).

## Alternativas consideradas
- **SSR dinámico puro:** innecesario para datos públicos estables; encarece y lentifica sin beneficio.
- **CSR puro (SPA con SWR):** peor SEO, peor LCP, waterfall HTML→JS→fetch. Se reserva para sub-vistas interactivas puntuales, no para contenido principal.
- **SSG sin ISR:** acceptable para catálogo 100% estático, pero perdería auto-actualización si la API muta. ISR cuesta casi lo mismo y agrega resiliencia.

## Consecuencias
- **Positivas:**
  - HTML servido desde CDN edge → LCP bajo.
  - Costo mínimo en Vercel Hobby (4 rutas prebuildadas + pocas regeneraciones/día).
  - SEO correcto para presentación.
  - Datos auto-actualizados si la API cambia.
- **Negativas / Riesgos:**
  - Si la API cae durante build → build falla. Mitigación: manejo de errores + fallback a datos cacheados.
  - 24h de staleness máximo para usuarios; acceptable para fanclub.
  - Revalidaciones cuentan como function invocations en Vercel (límite Hobby ~100k/mes; nuestro techo proyectado es <100/mes).
- **Acciones derivadas:**
  - Crear `lib/api/houses.ts` con fetches tipados (TS, ADR-0003).
  - Aplicar `Promise.all` cuando una ruta necesite múltiples recursos (skill `async-parallel`).
  - Cargar SDK de Amplitude con baja prioridad (`bundle-defer-third-party`).
  - Tipado estricto del response de la API en `types/wizard-world.ts`.

## Notas
- Docs de referencia:
  - https://nextjs.org/docs/app/building-your-application/data-fetching/fetching
  - https://vercel.com/docs/incremental-static-regeneration/quickstart
  - Skill `vercel-react-best-practices` — reglas `async-parallel`, `server-cache-react`, `bundle-defer-third-party`.
