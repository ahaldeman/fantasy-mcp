import { afterAll, beforeEach, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";

vi.mock("../src/sleeper/client.js", () => ({
  getUserByUsername: vi.fn(),
}));
vi.mock("../src/db/client.js", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { buildServer } from "../src/server.js";
import { prisma } from "../src/db/client.js";
import { getUserByUsername } from "../src/sleeper/client.js";

const getUser = vi.mocked(getUserByUsername);
const findFirst = vi.mocked(prisma.user.findFirst);
const create = vi.mocked(prisma.user.create);

const app: FastifyInstance = buildServer();

const validBody = {
  firstName: "Alex",
  lastName: "H",
  email: "Alex@Example.com",
  sleeperUsername: "alexh",
};

const sleeperUser = { user_id: "12345", username: "alexh", display_name: "AlexH" };

function dbRow() {
  return {
    id: "u1",
    firstName: "Alex",
    lastName: "H",
    email: "alex@example.com",
    sleeperUserId: "12345",
    sleeperUsername: "alexh",
    displayName: "AlexH",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterAll(async () => {
  await app.close();
});

it("rejects an invalid body with 400 and never calls Sleeper", async () => {
  const res = await app.inject({ method: "POST", url: "/register", payload: { firstName: "Alex" } });
  expect(res.statusCode).toBe(400);
  expect(getUser).not.toHaveBeenCalled();
});

it("returns 422 when the Sleeper username doesn't exist", async () => {
  getUser.mockResolvedValue(null);
  const res = await app.inject({ method: "POST", url: "/register", payload: validBody });
  expect(res.statusCode).toBe(422);
});

it("returns 409 when the email or Sleeper user already exists", async () => {
  getUser.mockResolvedValue(sleeperUser);
  findFirst.mockResolvedValue(dbRow());
  const res = await app.inject({ method: "POST", url: "/register", payload: validBody });
  expect(res.statusCode).toBe(409);
});

it("returns 201 with an API key on success", async () => {
  getUser.mockResolvedValue(sleeperUser);
  findFirst.mockResolvedValue(null);
  create.mockResolvedValue(dbRow());

  const res = await app.inject({ method: "POST", url: "/register", payload: validBody });
  expect(res.statusCode).toBe(201);

  const body = res.json();
  // A signed JWT: three base64url segments.
  expect(body.token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
  expect(body.user.sleeperUserId).toBe("12345");

  // Email was normalized to lowercase before persisting.
  expect(create).toHaveBeenCalledWith(
    expect.objectContaining({ data: expect.objectContaining({ email: "alex@example.com" }) }),
  );
});
