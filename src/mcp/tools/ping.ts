import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Example tool used to verify the server end to end. Future Sleeper tools
// follow the same shape: a zod input schema plus a handler returning MCP content.
export const pingInputShape = {
  message: z
    .string()
    .optional()
    .describe("Optional text to echo back in the reply"),
};

const pingArgs = z.object(pingInputShape);
export type PingArgs = z.infer<typeof pingArgs>;

export function pingHandler({ message }: PingArgs) {
  const reply = message ? `pong: ${message}` : "pong";
  return {
    content: [
      {
        type: "text" as const,
        text: `${reply} (${new Date().toISOString()})`,
      },
    ],
  };
}

export function registerPingTool(server: McpServer): void {
  server.registerTool(
    "ping",
    {
      title: "Ping",
      description: "Health-check tool that echoes an optional message with a timestamp.",
      inputSchema: pingInputShape,
    },
    pingHandler,
  );
}
