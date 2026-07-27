# wizard-hub

> Web application for the Harry Potter fanclub — guides new members into the Hogwarts world.

Built as part of the **Solutions Architect Challenge**: consumes the [Wizard World API](https://wizard-world-api.herokuapp.com/) (`/Houses`, `/Houses/:id`) and instruments [Amplitude](https://amplitude.com/) for product analytics.

---

## Quick start

```bash
pnpm install
cp .env.example .env.local   # fill in your Amplitude key (optional for dev)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm test` | Run unit tests once |
| `pnpm test:watch` | Watch mode |
| `pnpm format` | Prettier write |
| `pnpm prepare` | Install husky hooks (auto on `pnpm install`) |

## Stack

See [`AGENTS.md`](./AGENTS.md) for full conventions, and [`docs/adr/`](./docs/adr/) for decisions.

- **Next.js 16** (App Router) · ADR-0002
- **TypeScript strict** · ADR-0003
- **Vercel Hobby** · ADR-0004
- **SSG + ISR** fetching (24h revalidate on `/houses`) · ADR-0005
- **Amplitude** via typed wrapper · ADR-0006 / 0007 / 0008
- **Hexagonal + DDD** per bounded context (`modules/houses/`) · ADR-0009
- **Mermaid** for HLD/LLD · ADR-0010
- **Conventional Commits** + PRs ≤ 300 LoC · ADR-0011
- **Vitest + ESLint + Prettier + husky** · ADR-0012
- **"Moonlit Armor"** visual identity (iridescent esoteric) · ADR-0013 + [`docs/design-system.md`](./docs/design-system.md)
- **Tailwind CSS v4** · ADR-0014
- **Custom SVG icons** (heraldic) · ADR-0015
- **Line-art illustration** (Marauder's Map style) · ADR-0016

## Project structure

```
app/                  Next.js App Router (presentation)
modules/houses/       Bounded context: domain / application / infrastructure
lib/                  Cross-cutting: analytics, api client, config
components/           Shared UI (icons, illustrations, primitives)
types/                Raw API response types
docs/                 ADRs, design system, diagrams
```

See ADR-0009 for layer rules and import constraints.

## Git conventions

- Branch: `<type>/<NNN>-<slug>` (e.g. `feat/002-houses-list-page`)
- Commit: Conventional Commits (`feat(houses): ...`)
- PR: self-contained, ≤ 300 LoC diff, 1 feature per PR
- See ADR-0011 and `.github/pull_request_template.md`.

## License

Personal / educational (Solutions Architect Challenge). Harry Potter and all related marks belong to their respective owners.
