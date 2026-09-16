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

it("GET /health returns ok", async () => {
  const res = await app.inject({ method: "GET", url: "/health" });
  expect(res.statusCode).toBe(200);
  expect(res.json()).toEqual({ status: "ok" });
});
