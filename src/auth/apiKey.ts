import { createHash, randomBytes } from "node:crypto";

// Issued keys look like "fmcp_<43 base64url chars>" (32 random bytes).
const KEY_PREFIX = "fmcp_";
const KEY_BYTES = 32;
const DISPLAY_PREFIX_LENGTH = 12;

export function generateApiKey(): string {
  return KEY_PREFIX + randomBytes(KEY_BYTES).toString("base64url");
}

// SHA-256 is right here: the key is high-entropy random, so a password hash
// (bcrypt/argon) would only add latency to every authenticated MCP request.
// We store this hash and look up the user by it.
export function hashApiKey(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// A short, non-secret slice kept for display/debugging (e.g. in logs or an
// account page). Never enough to reconstruct the key.
export function apiKeyPrefix(token: string): string {
  return token.slice(0, DISPLAY_PREFIX_LENGTH);
}
