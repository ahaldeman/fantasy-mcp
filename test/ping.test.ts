import { expect, it } from "vitest";

import { pingHandler } from "../src/mcp/tools/ping.js";

it("echoes a default reply when no message is given", () => {
  const result = pingHandler({});
  expect(result.content[0]?.type).toBe("text");
  expect(result.content[0]?.text).toMatch(/^pong \(/);
});

it("echoes the provided message", () => {
  const result = pingHandler({ message: "hello" });
  expect(result.content[0]?.text).toMatch(/^pong: hello \(/);
});
