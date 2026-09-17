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
