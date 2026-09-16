import { env } from "../config/env.js";

// Only the fields we use. Sleeper returns more (avatar, etc.); we don't store
// them, so we keep the type to what we consume.
export interface SleeperUser {
  user_id: string;
  username: string;
  display_name: string;
}

// GET /v1/user/<username>. Sleeper returns the user object, or a `null` body
// (sometimes a 404) when the username doesn't exist. Both map to null here.
// Any other non-OK response is a real error and throws.
export async function getUserByUsername(
  username: string,
): Promise<SleeperUser | null> {
  const url = `${env.SLEEPER_API_BASE_URL}/user/${encodeURIComponent(username)}`;
  const res = await fetch(url);

  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`Sleeper API error: ${res.status} ${res.statusText}`);
  }

  const body = (await res.json()) as SleeperUser | null;
  if (body === null) {
    return null;
  }
  return {
    user_id: body.user_id,
    username: body.username,
    display_name: body.display_name,
  };
}
