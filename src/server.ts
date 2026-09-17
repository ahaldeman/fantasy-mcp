import Fastify, { type FastifyInstance } from "fastify";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { env } from "./config/env.js";
import { authenticateRequest } from "./features/auth/authenticate.js";
import { registerRoutes } from "./features/auth/register.js";
import { leagueRoutes } from "./features/league/routes.js";
import { createMcpServer } from "./mcp/server.js";

// JSON-RPC error returned for transports/methods we don't support in stateless mode.
function methodNotAllowed() {
  return {
    jsonrpc: "2.0" as const,
    error: {
      code: -32000,
      message: "Method not allowed. This server runs in stateless mode; use POST /mcp.",
    },
    id: null,
  };
}

export function buildServer(): FastifyInstance {
  const app = Fastify({
    logger: { level: env.LOG_LEVEL },
  });

  // Plain liveness check. No MCP handshake required, easy to test with inject().
  app.get("/health", async () => ({ status: "ok" }));

  // Open routes: discover your leagues, then register to get an API key.
  leagueRoutes(app);
  registerRoutes(app);

  // Stateless Streamable HTTP: a fresh MCP server + transport per POST, built
  // only after the request is authenticated with a valid API key.
  app.post("/mcp", async (request, reply) => {
    const user = await authenticateRequest(request.headers.authorization);
    if (user === null) {
      return reply.code(401).header("WWW-Authenticate", "Bearer").send({
        jsonrpc: "2.0",
        error: { code: -32001, message: "Unauthorized" },
        id: null,
      });
    }

    const server = createMcpServer(user);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    reply.raw.on("close", () => {
      void transport.close();
      void server.close();
    });

    // Hand the raw socket to the transport; Fastify must not also reply.
    reply.hijack();
    await server.connect(transport);
    await transport.handleRequest(request.raw, reply.raw, request.body);
  });

  // Stateless mode has no server-initiated stream or session to resume/delete.
  app.get("/mcp", async (_request, reply) =>
    reply.code(405).send(methodNotAllowed()),
  );
  app.delete("/mcp", async (_request, reply) =>
    reply.code(405).send(methodNotAllowed()),
  );

  return app;
}
