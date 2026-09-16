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
| `SLEEPER_API_BASE_URL` | `https://api.sleeper.app/v1` | Sleeper API base (override to point at a stub) |
| `JWT_SECRET` | — (required) | HS256 signing secret for auth tokens (min 32 chars); rotate to revoke all tokens |

## Run

```bash
npm run dev              # tsx watch, reloads on change
# or
npm run build && npm start
```

The server listens on `http://$HOST:$PORT`. MCP is at `POST /mcp` (auth required), and `GET /health` is a plain liveness check.

## Authentication

Every `POST /mcp` request needs a token. You get one by registering yourself once. The token is a signed JWT that contains your identity, so the server authenticates each request by verifying the signature. No database lookup happens on the auth path.

Identity is anchored on your **Sleeper user_id**, which we resolve from your Sleeper username. Sleeper has no global "team ID" (a `roster_id` is scoped to a single league), so the username is what you supply and the permanent `user_id` is what we store.

Register (all four fields are required):

```bash
curl -sS -X POST http://127.0.0.1:3000/register \
  -H 'Content-Type: application/json' \
  -d '{"firstName":"Alex","lastName":"H","email":"alex@example.com","sleeperUsername":"your_sleeper_username"}'
```

The response contains your token:

```json
{ "token": "eyJhbGci…", "user": { "id": "…", "sleeperUserId": "…", "displayName": "…" } }
```

Response codes: `201` created, `400` invalid body, `422` unknown Sleeper username, `409` email or Sleeper user already registered.

Then call `/mcp` with the token in the `Authorization` header (the `Accept` header must list both types):

```bash
curl -sS -X POST http://127.0.0.1:3000/mcp \
  -H 'Authorization: Bearer eyJhbGci…' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

Tokens are long-lived and don't expire. They're signed with `JWT_SECRET`; **rotating that value invalidates every issued token at once**, which is the revocation mechanism (there is no per-token revocation). The token holds a snapshot of your name, email, and Sleeper display name as of registration, readable by anyone who has the token (it's signed, not encrypted), so treat it like a password.

### MCP client config

Streamable HTTP MCP clients pass custom headers, so the token rides in `Authorization`:

```json
{
  "mcpServers": {
    "fantasy": {
      "url": "https://<host>/mcp",
      "headers": { "Authorization": "Bearer eyJhbGci<your token>" }
    }
  }
}
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
  server.ts         Fastify app: /health + /register + /mcp (auth-guarded)
  config/env.ts     zod-validated environment config
  db/client.ts      PrismaClient on the pg driver adapter
  auth/
    token.ts        issue / verify signed JWTs
    authenticate.ts resolve an Authorization header to a user (verifies the token)
  routes/
    register.ts     POST /register
  sleeper/
    client.ts       Sleeper REST client (getUserByUsername)
  mcp/
    server.ts       createMcpServer(authUser): registers tools
    tools/          one file per tool
prisma/
  schema.prisma     datasource, generator, models
  migrations/       migration history
prisma.config.ts    supplies DATABASE_URL to Prisma CLI commands
test/               Vitest specs
```

The connection URL lives in `prisma.config.ts` rather than `schema.prisma`, and the Prisma client is built on `@prisma/adapter-pg` in `src/db/client.ts`.
