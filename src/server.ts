import Fastify, { type FastifyInstance } from "fastify";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { env } from "./config/env.js";
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

  // Stateless Streamable HTTP: a fresh MCP server + transport per POST.
  app.post("/mcp", async (request, reply) => {
    const server = createMcpServer();
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
