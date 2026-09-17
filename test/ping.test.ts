import { expect, it } from "vitest";

import type { AuthUser } from "../src/features/auth/authenticate.js";
import { pingHandler } from "../src/mcp/tools/ping.js";

const authUser: AuthUser = {
  id: "u1",
  firstName: "Alex",
  lastName: "H",
  email: "alex@example.com",
  sleeperUserId: "123",
  sleeperUsername: "alexh",
  sleeperLeagueId: "L1",
  displayName: "AlexH",
};

it("echoes a default reply naming the user when no message is given", () => {
  const result = pingHandler({}, authUser);
  expect(result.content[0]?.type).toBe("text");
  expect(result.content[0]?.text).toMatch(/^pong for AlexH \(/);
});

it("echoes the provided message and the user", () => {
  const result = pingHandler({ message: "hello" }, authUser);
  expect(result.content[0]?.text).toMatch(/^pong: hello for AlexH \(/);
});
