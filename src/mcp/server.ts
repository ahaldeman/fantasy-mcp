import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerPingTool } from "./tools/ping.js";

// Build a fresh MCP server with all tools registered. In stateless HTTP mode
// we create one of these per request; register future Sleeper tools here.
export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "fantasy-mcp",
    version: "0.1.0",
  });

  registerPingTool(server);

  return server;
}
