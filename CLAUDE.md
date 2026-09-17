# fantasy-mcp

An MCP server for fantasy football. It exposes tools backed by the [Sleeper](https://docs.sleeper.com/) public REST API and runs over Streamable HTTP. Identity is anchored on the Sleeper `user_id` (permanent); there is no global "team ID" in Sleeper (`roster_id` is league-scoped).

## Stack

- TypeScript (ESM), npm, Node 22 (see `.nvmrc`)
- Fastify hosting MCP over Streamable HTTP (`@modelcontextprotocol/sdk`)
- Prisma 7 + Postgres via the `@prisma/adapter-pg` driver adapter
- Vitest

## Run / test

```bash
nvm use
npm install
docker compose up -d      # local Postgres
npm run db:migrate
npm run dev               # or: npm run build && npm start
npm test
```

The connection URL lives in `prisma.config.ts` (not `schema.prisma`); the Prisma client is built on `@prisma/adapter-pg` in `src/db/client.ts`. Nothing auto-loads `.env`, so both the app and the Prisma config call Node's `process.loadEnvFile()`.

## Conventions

**Prefer required over optional (tell, don't ask).** Default parameters, object properties, and Prisma columns to required. Use optional/nullable only for genuine absence, and prefer a nullable return or input union over a `?`-optional.
- Bad: `createMcpServer(authUser?: AuthUser)` (auth is always enforced first, so the value is always present).
- Good: `createMcpServer(authUser: AuthUser)`.

Full details and the allowed exceptions: @.claude/rules/typescript.md

**Feature-first packages.** Each domain is a vertical slice under `src/features/<domain>/` holding its own source (Sleeper calls), repository (persistence/queries), sync (job logic), and tools (MCP), following the flow Sleeper -> internal domain -> MCP. Shared infra (`config`, `db`, the `sleeper` client, and the `mcp`/`jobs`/`server` composition roots) stays at the top of `src/`. A feature may import shared infra and another feature's repository, never another feature's tools/routes.

Full details: @.claude/rules/structure.md
