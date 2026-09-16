import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";

import { env } from "../config/env.js";
import type { AuthUser } from "./authenticate.js";

const ALG = "HS256";
const ISSUER = "fantasy-mcp";

const secret = new TextEncoder().encode(env.JWT_SECRET);

// The identity claims we sign into the token. Mutable Sleeper metadata
// (displayName) and account details (name, email) are snapshots as of
// registration; the stable anchor is sleeperUserId.
const tokenClaims = z.object({
  sub: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  sleeperUserId: z.string(),
  sleeperUsername: z.string(),
  displayName: z.string(),
});

// Issue a long-lived signed token (no expiry). Revocation is by rotating
// JWT_SECRET, which invalidates every token at once.
export async function issueToken(user: AuthUser): Promise<string> {
  return new SignJWT({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    sleeperUserId: user.sleeperUserId,
    sleeperUsername: user.sleeperUsername,
    displayName: user.displayName,
  })
    .setProtectedHeader({ alg: ALG })
    .setIssuer(ISSUER)
    .setSubject(user.id)
    .setIssuedAt()
    .sign(secret);
}

// Verify a token's signature and issuer and return the identity, or null if
// the token is missing a claim, tampered, or signed with a different secret.
export async function verifyToken(token: string): Promise<AuthUser | null> {
  let payload: unknown;
  try {
    ({ payload } = await jwtVerify(token, secret, { issuer: ISSUER }));
  } catch {
    return null;
  }

  const parsed = tokenClaims.safeParse(payload);
  if (!parsed.success) {
    return null;
  }
  const { sub, ...rest } = parsed.data;
  return { id: sub, ...rest };
}
