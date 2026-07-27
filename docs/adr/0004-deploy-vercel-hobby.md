# ADR-0004: Deploy en Vercel (Hobby plan)

- **Estado:** Aceptado
- **Fecha:** 2026-07-27
- **Decisor(es):** kerty + arquitecto
- **Relacionado:** ADR-0002 (Next.js), HOST-001

## Contexto
El challenge pide hosting "deseable". Viene del ADR-0002 (Next.js). Hay tres opciones concretas para Next.js: Vercel, Netlify, Cloudflare Pages, o self-host (Node container).

## Decisión
Usar **Vercel (Hobby plan, $0)** como hosting principal para todo el ciclo de vida del challenge.

- Proyecto marcado como personal/no-comercial (cumpla con los Términos de Hobby).
- Conexión al repo GitHub para deploys automáticos por push.
- Preview deployments por branch/PR habilitados.
- Production deployment desde la rama principal (definida en REPO-001).

## Alternativas consideradas
| Alternativa | Por qué se descarta |
|---|---|
| **Netlify** | Funciona con Next.js vía plugin, pero ISR/Edge no son first-class. Vercel tiene menos fricción con el framework que ellos mismos mantienen. |
| **Cloudflare Pages** | Buenísimo costo/performance, pero requiere `@cloudflare/next-on-pages` y limita a Edge Runtime + Node compat. Overhead innecesario para el scope. |
| **Self-host (Fly.io / Railway / VPS)** | Máxima portabilidad pero perdemos push-to-deploy, previews y DX. Solo justificable si el challenge escalara o si Términos de Vercel Hobby dejaran de aplicar. |

## Consecuencias
- **Positivas:**
  - Push-to-deploy, preview por PR, dominio `.vercel.app` gratuito, HTTPS automático, analytics de build.
  - Soporte nativo de todas las features de Next.js que usemos (ISR, Image Optimization, Edge si lo necesitáramos).
- **Negativas:**
  - Acoplamiento con Vercel (verificado y aceptado en ADR-0002 §Trade-offs).
  - Límites del Hobby plan (function invocations, bandwidth, builds). Suficientes para el challenge; habría que monitorear si el fanclub escala.
  - Términos de Hobby prohíben uso comercial — el fanclub + challenge califica, pero registrar el caso si el uso muta.
- **Mitigaciones:**
  - Mantener el código portable: evitar APIs exclusivas de Vercel (p.ej. `@vercel/*` SDKs salvo necesidad justificada por ADR).
  - Documentar en el README cómo sería una migración (Node container standalone build).

## Notas
- Plan: https://vercel.com/docs/limits/usage-faq
- Hobby terms: https://vercel.com/articles/personal-website-vs-commercial-website
