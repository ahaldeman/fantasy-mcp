import { env } from "../config/env.js";
import {
  SleeperLeague,
  SleeperRawPlayer,
  SleeperRoster,
  SleeperUser,
} from "./types.js";

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

// GET /v1/league/<league_id>/users. Returns the league's members, or an empty
// array when the league doesn't exist (Sleeper sends a null body). Any non-OK
// response is a real error and throws.
export async function getLeagueUsers(
  leagueId: string,
): Promise<SleeperUser[]> {
  const url = `${env.SLEEPER_API_BASE_URL}/league/${encodeURIComponent(leagueId)}/users`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Sleeper API error: ${res.status} ${res.statusText}`);
  }

  const body = (await res.json()) as SleeperUser[] | null;
  if (body === null) {
    return [];
  }
  return body.map((user) => ({
    user_id: user.user_id,
    username: user.username,
    display_name: user.display_name,
  }));
}

// GET /v1/user/<user_id>/leagues/nfl/<season>. Returns the user's leagues for
// that season, or an empty array when they're in none. Any non-OK response is a
// real error and throws.
export async function getLeaguesForUser(
  userId: string,
  season: string,
): Promise<SleeperLeague[]> {
  const url = `${env.SLEEPER_API_BASE_URL}/user/${encodeURIComponent(userId)}/leagues/nfl/${encodeURIComponent(season)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Sleeper API error: ${res.status} ${res.statusText}`);
  }

  const body = (await res.json()) as SleeperLeague[] | null;
  if (body === null) {
    return [];
  }
  return body.map((league) => ({
    league_id: league.league_id,
    name: league.name,
  }));
}

// GET /v1/league/<league_id>/rosters. Returns every team's roster in the
// league, or an empty array when the league has none (null body). Sleeper
// sometimes sends null for players/starters; those are normalized to []. Any
// non-OK response is a real error and throws.
export async function getRosters(leagueId: string): Promise<SleeperRoster[]> {
  const url = `${env.SLEEPER_API_BASE_URL}/league/${encodeURIComponent(leagueId)}/rosters`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Sleeper API error: ${res.status} ${res.statusText}`);
  }

  const body = (await res.json()) as
    | Array<{
        roster_id: number;
        owner_id: string | null;
        players: string[] | null;
        starters: string[] | null;
        reserve: string[] | null;
        taxi: string[] | null;
      }>
    | null;
  if (body === null) {
    return [];
  }
  return body.map((roster) => ({
    roster_id: roster.roster_id,
    owner_id: roster.owner_id,
    players: roster.players ?? [],
    starters: roster.starters ?? [],
    injuredReserve: roster.reserve ?? [],
    taxiSquad: roster.taxi ?? [],
  }));
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
