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

// The players/nfl fields we curate. Sleeper omits most of these freely, so
// everything past the id is optional here.
export interface SleeperRawPlayer {
  player_id?: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  search_full_name?: string | null;
  position?: string | null;
  team?: string | null;
  fantasy_positions?: string[] | null;
  status?: string | null;
  injury_status?: string | null;
  age?: number | null;
  years_exp?: number | null;
  number?: number | null;
  active?: boolean | null;
}

// GET /v1/players/nfl. Returns the full catalog keyed by player_id (~14MB).
// Call this at most once a day, per Sleeper's guidance.
export async function getAllPlayers(): Promise<Record<string, SleeperRawPlayer>> {
  const res = await fetch(`${env.SLEEPER_API_BASE_URL}/players/nfl`);
  if (!res.ok) {
    throw new Error(`Sleeper API error: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as Record<string, SleeperRawPlayer>;
}
