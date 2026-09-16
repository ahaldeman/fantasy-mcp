import { expect, it } from "vitest";

import { apiKeyPrefix, generateApiKey, hashApiKey } from "../src/auth/apiKey.js";

it("generates a prefixed key that decodes to 32 bytes", () => {
  const key = generateApiKey();
  expect(key.startsWith("fmcp_")).toBe(true);
  const raw = key.slice("fmcp_".length);
  expect(Buffer.from(raw, "base64url")).toHaveLength(32);
});

it("generates distinct keys", () => {
  expect(generateApiKey()).not.toBe(generateApiKey());
});

it("hashes deterministically to a 64-char hex sha256", () => {
  const key = generateApiKey();
  const hash = hashApiKey(key);
  expect(hash).toBe(hashApiKey(key));
  expect(hash).toMatch(/^[0-9a-f]{64}$/);
});

it("prefix is a short slice of the key", () => {
  const key = generateApiKey();
  expect(apiKeyPrefix(key)).toBe(key.slice(0, 12));
});
