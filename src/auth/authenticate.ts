import { prisma } from "../db/client.js";
import { hashApiKey } from "./apiKey.js";

// The authenticated identity handed to the MCP layer. Deliberately excludes
// the API key hash and other secrets — only what tools need to act as the user.
export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  sleeperUserId: string;
  sleeperUsername: string;
  displayName: string;
}

function parseBearer(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader) {
    return null;
  }
  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }
  return token;
}

// Resolve an Authorization header to a user, or null if it's missing,
// malformed, or doesn't match a stored key. A missing/malformed header never
// hits the database.
export async function authenticateRequest(
  authorizationHeader: string | undefined,
): Promise<AuthUser | null> {
  const token = parseBearer(authorizationHeader);
  if (token === null) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { apiKeyHash: hashApiKey(token) },
  });
  if (user === null) {
    return null;
  }

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    sleeperUserId: user.sleeperUserId,
    sleeperUsername: user.sleeperUsername,
    displayName: user.displayName,
  };
}
