import { afterEach, expect, it, vi } from "vitest";

import { getUserByUsername } from "../src/sleeper/client.js";

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
