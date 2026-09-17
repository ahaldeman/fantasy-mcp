// Only the fields we use. Sleeper returns more (avatar, etc.); we don't store
// them, so we keep the type to what we consume.
export interface SleeperUser {
  user_id: string;
  username: string;
  display_name: string;
}

// Only the fields we use from a Sleeper league object. Sleeper returns much
// more (scoring settings, roster positions, etc.).
export interface SleeperLeague {
  league_id: string;
  name: string;
}

// A team's roster in a league. `owner_id` is genuinely absent for orphan teams.
// `starters` is slot-ordered and carries "0" in empty slots; `players` is the
// full set of rostered ids and is a superset of `injuredReserve` and
// `taxiSquad` (the dynasty taxi squad). All the arrays are normalized to []
// from Sleeper's nulls; leagues without IR/taxi slots just have empty ones.
// (Sleeper's raw fields for the last two are `reserve` and `taxi`; we map to
// the full domain terms.)
export interface SleeperRoster {
  roster_id: number;
  owner_id: string | null;
  players: string[];
  starters: string[];
  injuredReserve: string[];
  taxiSquad: string[];
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
