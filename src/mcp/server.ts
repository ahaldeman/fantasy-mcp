import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { AuthUser } from "../features/auth/authenticate.js";
import { registerPingTool } from "./tools/ping.js";

// Build a fresh MCP server with all tools registered. In stateless HTTP mode we
// create one of these per request, after the request has been authenticated, so
// the user is always known here. Future Sleeper tools use `authUser` to default
// to that user's Sleeper identity.
export function createMcpServer(authUser: AuthUser): McpServer {
  const server = new McpServer({
    name: "fantasy-mcp",
    version: "0.1.0",
  });

  registerPingTool(server, authUser);

  return server;
}
