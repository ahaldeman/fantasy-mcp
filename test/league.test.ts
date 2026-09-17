import { afterAll, beforeEach, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";

vi.mock("../src/sleeper/client.js", () => ({
  getUserByUsername: vi.fn(),
  getLeaguesForUser: vi.fn(),
}));

import { buildServer } from "../src/server.js";
import { getUserByUsername, getLeaguesForUser } from "../src/sleeper/client.js";

const getUser = vi.mocked(getUserByUsername);
const getLeagues = vi.mocked(getLeaguesForUser);

const app: FastifyInstance = buildServer();

const sleeperUser = { user_id: "12345", username: "alexh", display_name: "AlexH" };

beforeEach(() => {
  vi.clearAllMocks();
});

afterAll(async () => {
  await app.close();
});

it("rejects a non-year season with 400 and never calls Sleeper", async () => {
  const res = await app.inject({
    method: "GET",
    url: "/leagues/nfl",
    query: { username: "alexh" },
  });
  expect(res.statusCode).toBe(400);
  expect(getUser).not.toHaveBeenCalled();
});

it("rejects a missing username with 400 and never calls Sleeper", async () => {
  const res = await app.inject({ method: "GET", url: "/leagues/2026" });
  expect(res.statusCode).toBe(400);
  expect(getUser).not.toHaveBeenCalled();
});

it("returns 404 when the Sleeper username doesn't exist", async () => {
  getUser.mockResolvedValue(null);
  const res = await app.inject({
    method: "GET",
    url: "/leagues/2026",
    query: { username: "nope" },
  });
  expect(res.statusCode).toBe(404);
  expect(getLeagues).not.toHaveBeenCalled();
});

it("returns the leagues as [{ id, name }] on success", async () => {
  getUser.mockResolvedValue(sleeperUser);
  getLeagues.mockResolvedValue([
    { league_id: "L1", name: "Dynasty" },
    { league_id: "L2", name: "Redraft" },
  ]);

  const res = await app.inject({
    method: "GET",
    url: "/leagues/2026",
    query: { username: "alexh" },
  });
  expect(res.statusCode).toBe(200);
  expect(res.json()).toEqual([
    { id: "L1", name: "Dynasty" },
    { id: "L2", name: "Redraft" },
  ]);
  // Resolved the username to an id, then asked for that id's leagues.
  expect(getLeagues).toHaveBeenCalledWith("12345", "2026");
});
