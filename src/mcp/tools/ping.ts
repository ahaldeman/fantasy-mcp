import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import type { AuthUser } from "../../features/auth/authenticate.js";

// Example tool used to verify the server end to end. Future Sleeper tools
// follow the same shape: a zod input schema plus a handler that also has the
// authenticated user in scope.
export const pingInputShape = {
  message: z
    .string()
    .optional()
    .describe("Optional text to echo back in the reply"),
};

const pingArgs = z.object(pingInputShape);
export type PingArgs = z.infer<typeof pingArgs>;

export function pingHandler({ message }: PingArgs, authUser: AuthUser) {
  const reply = message ? `pong: ${message}` : "pong";
  return {
    content: [
      {
        type: "text" as const,
        text: `${reply} for ${authUser.displayName} (${new Date().toISOString()})`,
      },
    ],
  };
}

export function registerPingTool(server: McpServer, authUser: AuthUser): void {
  server.registerTool(
    "ping",
    {
      title: "Ping",
      description: "Health-check tool that echoes an optional message with a timestamp.",
      inputSchema: pingInputShape,
    },
    (args) => pingHandler(args, authUser),
  );
}
