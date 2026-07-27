# ADR-0011: Estrategia de Git — branches feature-based numeradas + PRs autocontenidos

- **Estado:** Aceptado
- **Fecha:** 2026-07-27
- **Decisor(es):** kerty + arquitecto
- **Relacionado:** REPO-001

## Contexto
Repo en GitHub, deploy automático por push a `master` (ver ADR-0004 Vercel). Necesitamos convención de branches, commits, y reglas de PR que sostengan el principio "minimal primero, luego ampliar" + revisiones revisables.

## Decisión

### Branches — feature-based numeradas

Formato: `<type>/<NNN>-<slug>`

- `type`: `feat` | `fix` | `chore` | `docs` | `refactor` | `test` | `perf`
- `NNN`: número secuencial de issue/PR alineado con el backlog (mantiene orden cronológico).
- `slug`: descripción corta en kebab-case.

**Ejemplos:**
- `feat/001-scaffold-nextjs`
- `feat/002-houses-list-page`
- `feat/003-amplitude-wrapper`
- `fix/004-house-detail-404`
- `docs/005-hld-diagram`
- `chore/006-eslint-config`

**Reglas:**
- 1 branch = 1 PR = 1 feature lógica.
- Si la feature crece, partir en múltiples branches/PRs numerados correlativos.
- Branches se borran después del merge.

### Commits — Conventional Commits

```
<type>(<scope>): <subject>

<body opcional>

<footer opcional: BREAKING CHANGE: | Fixes #NNN>
```

- `type`: `feat` | `fix` | `docs` | `style` | `refactor` | `test` | `chore` | `perf` | `ci`
- `scope`: módulo afectado (`houses`, `wizards`, `analytics`, `infra`, `repo`...).
- `subject`: imperativo, ≤72 chars, sin punto final.

**Ejemplos:**
- `feat(houses): add /houses list page with ISR`
- `fix(analytics): deduplicate page view on hydration`
- `docs(diagrams): add HLD with mermaid`
- `chore(repo): setup eslint + prettier`

### PRs — autocontenidos y pequeños

**Reglas hard:**
- **≤300 líneas de diff** (excluyendo `package-lock.json`, `pnpm-lock.yaml`, snapshots generados y archivos de tests que no sean unitarios).
- **Self-contained:** el branch debe dejar `master` en estado deployable y verde (build + lint + typecheck + tests pasan).
- **1 sola feature lógica por PR.** Si necesitás tocar 3 áreas no relacionadas, son 3 PRs.
- **Título + descripción** siguiendo template (`.github/pull_request_template.md`).
- **Descripción debe linkear el ADR relevante** si la feature es "significativa" (regla del AGENTS.md §2).

**Template de PR** (`.github/pull_request_template.md`):
```markdown
## Qué hace
<!-- 1-2 líneas, en presente -->

## Por qué
<!-- Motivo. Si toca decisión "significativa", linkear ADR. -->

## Cómo verificarlo
- [ ] `pnpm typecheck` pasa
- [ ] `pnpm lint` pasa
- [ ] `pnpm test` pasa
- [ ] Cambios verificados manualmente en: <URL o pasos>

## Scope check
- [ ] Diff ≤300 LoC (excluyendo lock/snapshots)
- [ ] 1 feature lógica
- [ ] No incluye cambios no relacionados
```

## Alternativas consideradas
| Alternativa | Por qué se descarta |
|---|---|
| **GitFlow (develop + release branches)** | Pensado para productos con releases versionados. Overkill para un deploy-continuo a Vercel. |
| **Trunk-based sin numeración** | Funciona, pero perdés la trazabilidad numérica con ADRs/backlog. |
| **Branches por persona** | Mezcla autoría con feature. Confuso para revertir. |

## Consecuencias
- **Positivas:**
  - PRs revisables en <15 min cada uno.
  - Trazabilidad branch → PR → ADR → deploy.
  - `git log` legible y generable como changelog.
- **Negativas / Riesgos:**
  - Features grandes requieren skill de "partir en PRs chicos". Mitigación:disciplina + peer review del plan antes de codear.
  - 300 LoC puede ser restrictivo para cambios cross-cutting (p.ej. rename global). Mitigación: esos PRs se documentan como excepción en la descripción.
- **Acciones derivadas:**
  - Crear `.github/pull_request_template.md`.
  - Agregar commitlint + husky para enforce Conventional Commits (ver ADR-0012 QA).
  - Configurar Vercel para exigir "PR check passed" antes de deploy a production.

## Notas
- Conventional Commits spec: https://www.conventionalcommits.org/
- Límite 300 LoC inspirado en estudios de review effectiveness (SmartBear, Google Engineering Practices).
