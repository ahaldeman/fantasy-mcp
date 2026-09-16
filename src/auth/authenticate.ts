import { verifyToken } from "./token.js";

// The authenticated identity handed to the MCP layer. Reconstructed entirely
// from the signed token, so authentication reads no database.
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

// Resolve an Authorization header to a user by verifying the token's
// signature. Returns null if the header is missing, malformed, or the token
// doesn't verify. No database lookup.
export async function authenticateRequest(
  authorizationHeader: string | undefined,
): Promise<AuthUser | null> {
  const token = parseBearer(authorizationHeader);
  if (token === null) {
    return null;
  }
  return verifyToken(token);
}
