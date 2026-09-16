import { afterAll, beforeAll, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";

import { buildServer } from "../src/server.js";

let app: FastifyInstance;

beforeAll(() => {
  app = buildServer();
});

afterAll(async () => {
  await app.close();
});

it("rejects POST /mcp without an Authorization header (401)", async () => {
  const res = await app.inject({
    method: "POST",
    url: "/mcp",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    payload: { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} },
  });
  expect(res.statusCode).toBe(401);
  expect(res.headers["www-authenticate"]).toBe("Bearer");
});

it("rejects a malformed Authorization header (401)", async () => {
  const res = await app.inject({
    method: "POST",
    url: "/mcp",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      authorization: "Basic abc",
    },
    payload: { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} },
  });
  expect(res.statusCode).toBe(401);
});

it("rejects a Bearer value that isn't a valid token (401)", async () => {
  const res = await app.inject({
    method: "POST",
    url: "/mcp",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      authorization: "Bearer not.a.valid.jwt",
    },
    payload: { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} },
  });
  expect(res.statusCode).toBe(401);
});
