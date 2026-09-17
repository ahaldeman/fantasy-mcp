import { SignJWT } from "jose";
import { expect, it } from "vitest";

import type { AuthUser } from "../src/features/auth/authenticate.js";
import { issueToken, verifyToken } from "../src/features/auth/token.js";

const authUser: AuthUser = {
  id: "u1",
  firstName: "Alex",
  lastName: "H",
  email: "alex@example.com",
  sleeperUserId: "123",
  sleeperUsername: "alexh",
  displayName: "AlexH",
};

function secret(value = process.env.JWT_SECRET as string): Uint8Array {
  return new TextEncoder().encode(value);
}

it("round-trips identity through a signed token", async () => {
  const token = await issueToken(authUser);
  expect(token.split(".")).toHaveLength(3);
  expect(await verifyToken(token)).toEqual(authUser);
});

it("rejects a tampered token", async () => {
  const token = await issueToken(authUser);
  expect(await verifyToken(token + "x")).toBeNull();
});

it("rejects a token signed with a different secret", async () => {
  const token = await new SignJWT({ ...authUser })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("fantasy-mcp")
    .setSubject(authUser.id)
    .sign(secret("a-different-secret-that-is-also-32-chars-long"));
  expect(await verifyToken(token)).toBeNull();
});

it("rejects a token with the wrong issuer", async () => {
  const token = await new SignJWT({ ...authUser })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("someone-else")
    .setSubject(authUser.id)
    .sign(secret());
  expect(await verifyToken(token)).toBeNull();
});

it("rejects a well-signed token that's missing claims", async () => {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("fantasy-mcp")
    .setSubject(authUser.id)
    .sign(secret());
  expect(await verifyToken(token)).toBeNull();
});
