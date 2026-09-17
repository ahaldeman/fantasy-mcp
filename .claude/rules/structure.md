# Package structure

This project is organized **feature-first**. Each domain is a vertical slice, and the flow the product is built around lives inside it: **Sleeper API (source) -> an internal domain we persist and own -> MCP tools tailored for an LLM**.

## Shared infrastructure (top of `src/`)

Cross-cutting plumbing with no single domain owner:
- `config/` — env parsing.
- `db/` — the Prisma client.
- `sleeper/client.ts` — the low-level Sleeper HTTP client (base URL, fetch, error handling).
- `mcp/server.ts` — MCP composition root; registers each feature's tools.
- `jobs/scheduler.ts` — pg-boss composition root; registers each feature's scheduled jobs. Job entrypoints (CLI runners) also live here.
- `server.ts` — Fastify composition root; mounts each feature's routes and guards `/mcp`.
- `index.ts` — process entrypoint.

## Features (`src/features/<domain>/`)

Each domain owns its whole slice. Files are created as the domain needs them, not pre-stubbed:
- `source.ts` — that domain's Sleeper endpoint calls (built on the shared `sleeper/client.ts`), mapping raw responses.
- `repository.ts` — persistence and queries for the domain's own tables.
- `sync.ts` — job logic that drives `source -> repository`.
- `tools.ts` — MCP tools/resources for the domain, tailored for the LLM.
- `routes.ts` — HTTP routes for the domain.

A small domain may keep several layers in one file and split them out as it grows. Example: `features/players/sync.ts` currently holds its source call and repository writes inline; it will split into `source.ts` + `repository.ts` when the players MCP tools arrive.

## Import direction (one way)

- A feature may import shared infra (`config`, `db`, `sleeper`) and another feature's **`repository`** (domain data), but never another feature's **`tools`** or **`routes`** (interface layer).
- The composition roots (`mcp/server.ts`, `server.ts`, `jobs/scheduler.ts`) import each feature's registration and wire it. Dependencies point from infra/composition into features, and from features into shared infra, never sideways between features' interface layers.

## Adding a new domain

Create `src/features/<domain>/`, add the layer files it needs, and register its tools/routes/jobs from the composition roots. Keep the Sleeper calls for that domain in its `source.ts`, not in the shared client.
