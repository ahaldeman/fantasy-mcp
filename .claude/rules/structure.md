# Package structure

This project is organized **feature-first**. Each domain is a vertical slice, and the flow the product is built around lives inside it: **Sleeper API -> an internal domain we persist and own -> MCP tools tailored for an LLM**. The Sleeper calls themselves live in the shared `sleeper/client.ts`, not in the feature; the feature imports them.

## Shared infrastructure (top of `src/`)

Cross-cutting plumbing with no single domain owner:
- `config/` — env parsing.
- `db/` — the Prisma client.
- `sleeper/client.ts` — every Sleeper endpoint call (base URL, fetch, error handling, response mapping), for all domains. Features import these functions; they don't wrap the Sleeper API themselves.
- `sleeper/types.ts` — every Sleeper response type used across the app.
- `mcp/server.ts` — MCP composition root; registers each feature's tools.
- `jobs/scheduler.ts` — pg-boss composition root; registers each feature's scheduled jobs. Job entrypoints (CLI runners) also live here.
- `server.ts` — Fastify composition root; mounts each feature's routes and guards `/mcp`.
- `index.ts` — process entrypoint.

## Features (`src/features/<domain>/`)

Each domain owns its whole slice. Files are created as the domain needs them, not pre-stubbed:
- `repository.ts` — persistence and queries for the domain's own tables.
- `sync.ts` — job logic that drives `sleeper/client.ts -> repository`.
- `tools.ts` — MCP tools/resources for the domain, tailored for the LLM.
- `routes.ts` — HTTP routes for the domain.

A small domain may keep several layers in one file and split them out as it grows. Example: `features/players/sync.ts` currently holds its repository writes inline; it will split into a `repository.ts` when the players MCP tools arrive.

## Import direction (one way)

- A feature may import shared infra (`config`, `db`, `sleeper`) and another feature's **`repository`** (domain data), but never another feature's **`tools`** or **`routes`** (interface layer).
- The composition roots (`mcp/server.ts`, `server.ts`, `jobs/scheduler.ts`) import each feature's registration and wire it. Dependencies point from infra/composition into features, and from features into shared infra, never sideways between features' interface layers.

## Adding a new domain

Create `src/features/<domain>/`, add the layer files it needs, and register its tools/routes/jobs from the composition roots. Add that domain's Sleeper calls to the shared `sleeper/client.ts` (types in `sleeper/types.ts`), and import them into the feature.
