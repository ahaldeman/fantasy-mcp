# fantasy-mcp

An MCP server for fantasy football. It exposes tools that pull data from the [Sleeper](https://docs.sleeper.com/) public REST API (leagues, rosters, matchups, players, and more) so an MCP client can answer questions about your leagues. It runs over Streamable HTTP and uses Postgres for persistence.

## Stack

- TypeScript (ESM), npm
- Fastify hosting MCP over Streamable HTTP
- [`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/typescript-sdk)
- Prisma + Postgres (via the `@prisma/adapter-pg` driver adapter)
- Vitest

## Prerequisites

- Node 22. The repo pins it in `.nvmrc`, so `nvm use` selects the right version.
- A Postgres database. The bundled `docker-compose.yml` runs one locally, or point `DATABASE_URL` at your own.
- Docker, if you use the bundled Postgres.

## Setup

```bash
nvm use              # Node 22
npm install
cp .env.example .env  # then set DATABASE_URL if you aren't using the bundled Postgres
docker compose up -d  # local Postgres on :5432, matching .env
npm run db:migrate    # apply migrations
```

## Configuration

Environment variables (see `.env.example`):

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | — (required) | Postgres connection string |
| `PORT` | `3000` | HTTP port |
| `HOST` | `127.0.0.1` | Bind address |
| `LOG_LEVEL` | `info` | Fastify/pino log level |

## Run

```bash
npm run dev              # tsx watch, reloads on change
# or
npm run build && npm start
```

The server listens on `http://$HOST:$PORT`. MCP is at `POST /mcp`, and `GET /health` is a plain liveness check.

To exercise the endpoint directly (the `Accept` header must list both types):

```bash
curl -sS -X POST http://127.0.0.1:3000/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

## Tests

```bash
npm test         # run once
npm run test:watch
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Run with `tsx watch` |
| `npm run build` | Compile to `dist/` with `tsc` |
| `npm start` | Run compiled `dist/index.js` |
| `npm test` | Run Vitest once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run db:migrate` | Apply migrations in development (`prisma migrate dev`) |
| `npm run db:deploy` | Apply migrations elsewhere (`prisma migrate deploy`) |
| `npm run db:generate` | Regenerate the Prisma client |
| `npm run db:studio` | Open Prisma Studio |

## Layout

```
src/
  index.ts          entrypoint: load env, start Fastify, handle shutdown
  server.ts         Fastify app: /health + /mcp
  config/env.ts     zod-validated environment config
  db/client.ts      PrismaClient on the pg driver adapter
  mcp/
    server.ts       createMcpServer(): registers tools
    tools/          one file per tool
prisma/
  schema.prisma     datasource, generator, models
  migrations/       migration history
prisma.config.ts    supplies DATABASE_URL to Prisma CLI commands
test/               Vitest specs
```

The connection URL lives in `prisma.config.ts` rather than `schema.prisma`, and the Prisma client is built on `@prisma/adapter-pg` in `src/db/client.ts`.
