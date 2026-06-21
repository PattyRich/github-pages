## Orientation

Praynr is a monorepo: a React 19 + TypeScript frontend (`apps/frontend`) and a Flask + RQ backend (`services/api`), deployed via Docker Compose and GitHub Actions. One backend serves two products: OSRS Bingo boards and LoL-Beat (a League of Legends social-graph pathfinder).

Read these before working outside familiar territory instead of re-deriving what's already written down:
- `README.md` — tech stack, quick start, test commands, deploy/backup procedures.
- `docs/architecture.md` — system design, data models, Mongo/Redis schema, background job flow.
- `docs/lol-beat.md` — LoL-Beat graph schema, crawl strategy, API.
- `DESIGN.md` — frontend visual system. Read before touching any UI.

## General Rules

Do not run build, test, or lint after every task by default. The user will run full verification before pushing, and a pre-push git hook already runs `make test` automatically, so running it again mid-task is redundant. Run verification only when explicitly requested, or when a change is high-risk and needs a focused check.
Don't tell me you didn't run them.

When verification *is* requested, use (full list in `Makefile`):
- `make typecheck` — frontend TypeScript only
- `make frontend-verify` — frontend typecheck + lint + format check + unit tests
- `make test-backend` — pytest on `services/api`
- `make test` — all of the above, plus Playwright E2E (requires `make dev` running first)

Never read, print, log, or commit `services/api/.env` — it holds live secrets. Use `services/api/.env.example` as the schema reference instead.

## Frontend Design

Before changing frontend UI, read `DESIGN.md` at the project root and preserve the OSRS visual system documented there.
Use the existing CSS custom properties in `apps/frontend/src/index.css` before adding new raw colors, spacing, shadows, or component treatments. `DESIGN.md`'s Token Reference table maps design-system names (e.g. "Quest Gold") to the actual `--osrs-*` variables — the two don't share spelling, so check the table rather than guessing or inventing a variable name.

- Reusable UI primitives: `apps/frontend/src/components/ui`
- Route/feature-specific styling: `apps/frontend/src/pages/*.css`, `apps/frontend/src/features/*/*.css`

## Backend

Flask routes split into blueprints by product, sharing Mongo, Redis, and the rate limiter:
- Bingo: `services/api/server.py`
- LoL-Beat: `services/api/lol_server.py` + `crawler.py`, background crawl jobs run via an RQ worker

See `docs/architecture.md` for the full job lifecycle and data model. Backend tests live in `services/api/test_server.py`.

## Maintenance Mode

`IS_MAINTENANCE` in `apps/frontend/src/index.tsx` is a manual flag that takes Bingo and LoL-Beat offline app-wide. If a route looks intentionally blocked rather than broken, check this first before debugging further.
