import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Player } from "@prisma/client";

import type { AuthUser } from "../auth/authenticate.js";
import { getPlayersByIds } from "../players/repository.js";
import { getRosters } from "../../sleeper/client.js";

// One roster slot, flattened for the LLM: the Sleeper id plus the curated
// details we joined in. Details are null when the player isn't synced.
interface RosterPlayer {
  id: string;
  name: string;
  position: string | null;
  team: string | null;
  injuryStatus: string | null;
  status: string | null;
}

interface RosterView {
  leagueId: string;
  rosterId: number;
  starters: RosterPlayer[];
  bench: RosterPlayer[];
  injuredReserve: RosterPlayer[];
  taxiSquad: RosterPlayer[];
}

// A readable name, falling back through fullName, first+last, then the raw id
// (team defenses store their id as the team code, e.g. "CIN", with null names).
function playerName(player: Player | undefined, id: string): string {
  if (player === undefined) {
    return id;
  }
  if (player.fullName !== null) {
    return player.fullName;
  }
  const name = `${player.firstName ?? ""} ${player.lastName ?? ""}`.trim();
  return name.length > 0 ? name : id;
}

function toRosterPlayer(id: string, byId: Map<string, Player>): RosterPlayer {
  const player = byId.get(id);
  return {
    id,
    name: playerName(player, id),
    position: player?.position ?? null,
    team: player?.team ?? null,
    injuryStatus: player?.injuryStatus ?? null,
    status: player?.status ?? null,
  };
}

// Build the authenticated user's roster in their league, or null if no roster
// on that league belongs to them (shouldn't happen: registration verifies
// membership, but the league could change out from under a stale token).
export async function buildMyRoster(
  authUser: AuthUser,
): Promise<RosterView | null> {
  const rosters = await getRosters(authUser.sleeperLeagueId);
  const mine = rosters.find((roster) => roster.owner_id === authUser.sleeperUserId);
  if (mine === undefined) {
    return null;
  }

  // starters is slot-ordered with "0" for empty slots. injuredReserve and
  // taxiSquad are separate groups that Sleeper also folds into players, so
  // bench is everything rostered that isn't a starter, on IR, or on the taxi
  // squad.
  const starterIds = mine.starters.filter((id) => id !== "0");
  const injuredReserveIds = mine.injuredReserve;
  const taxiSquadIds = mine.taxiSquad;
  const assigned = new Set([...starterIds, ...injuredReserveIds, ...taxiSquadIds]);
  const benchIds = mine.players.filter((id) => !assigned.has(id));

  const byId = await getPlayersByIds([
    ...starterIds,
    ...benchIds,
    ...injuredReserveIds,
    ...taxiSquadIds,
  ]);
  return {
    leagueId: authUser.sleeperLeagueId,
    rosterId: mine.roster_id,
    starters: starterIds.map((id) => toRosterPlayer(id, byId)),
    bench: benchIds.map((id) => toRosterPlayer(id, byId)),
    injuredReserve: injuredReserveIds.map((id) => toRosterPlayer(id, byId)),
    taxiSquad: taxiSquadIds.map((id) => toRosterPlayer(id, byId)),
  };
}

export function registerRosterTool(server: McpServer, authUser: AuthUser): void {
  server.registerTool(
    "get_my_roster",
    {
      title: "Get my roster",
      description:
        "Return the authenticated user's fantasy roster in their league, grouped into starters, bench, injured reserve, and taxi squad, each player with name, position, team, and injury status.",
      inputSchema: {},
    },
    async () => {
      const roster = await buildMyRoster(authUser);
      if (roster === null) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: "No roster in your league belongs to you.",
            },
          ],
        };
      }
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(roster, null, 2) },
        ],
      };
    },
  );
}
