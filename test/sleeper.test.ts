import { afterEach, expect, it, vi } from "vitest";

import { getLeaguesForUser, getUserByUsername } from "../src/sleeper/client.js";

afterEach(() => {
  vi.restoreAllMocks();
});

function mockFetch(response: Response): void {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(response);
}

it("returns the mapped user for a known username", async () => {
  mockFetch(
    new Response(
      JSON.stringify({
        user_id: "12345",
        username: "alexh",
        display_name: "AlexH",
        avatar: "abc",
      }),
      { status: 200 },
    ),
  );

  const user = await getUserByUsername("alexh");
  expect(user).toEqual({
    user_id: "12345",
    username: "alexh",
    display_name: "AlexH",
  });
});

it("returns null when Sleeper responds with a null body", async () => {
  mockFetch(new Response("null", { status: 200 }));
  expect(await getUserByUsername("nope")).toBeNull();
});

it("returns null on a 404", async () => {
  mockFetch(new Response("", { status: 404 }));
  expect(await getUserByUsername("nope")).toBeNull();
});

it("throws on other non-OK responses", async () => {
  mockFetch(new Response("", { status: 500, statusText: "Server Error" }));
  await expect(getUserByUsername("alexh")).rejects.toThrow(/Sleeper API error: 500/);
});

it("returns the mapped leagues for a user", async () => {
  mockFetch(
    new Response(
      JSON.stringify([
        { league_id: "L1", name: "Dynasty", season: "2026", extra: "x" },
        { league_id: "L2", name: "Redraft", season: "2026" },
      ]),
      { status: 200 },
    ),
  );

  const leagues = await getLeaguesForUser("12345", "2026");
  expect(leagues).toEqual([
    { league_id: "L1", name: "Dynasty" },
    { league_id: "L2", name: "Redraft" },
  ]);
});

it("returns an empty array when the user is in no leagues (null body)", async () => {
  mockFetch(new Response("null", { status: 200 }));
  expect(await getLeaguesForUser("12345", "2026")).toEqual([]);
});

it("throws when the leagues call returns a non-OK response", async () => {
  mockFetch(new Response("", { status: 500, statusText: "Server Error" }));
  await expect(getLeaguesForUser("12345", "2026")).rejects.toThrow(/Sleeper API error: 500/);
});
