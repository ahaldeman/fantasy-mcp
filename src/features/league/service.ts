import { League } from "@prisma/client";

import { createLeagueSettings, fetchLeagueSettings } from "./repository.js";
import { getLeague } from "../../sleeper/client.js";

export async function getLeagueSettings(leagueId: string): Promise<League> {
  const storedLeague = await fetchLeagueSettings(leagueId);

  if (storedLeague) {
    return storedLeague;
  } else {
    const sleeperLeague = await getLeague(leagueId);
    if (sleeperLeague) {
      return await createLeagueSettings({
        id: sleeperLeague.league_id,
        name: sleeperLeague.name,
        season: sleeperLeague.season,
        scoringSettings: sleeperLeague.scoring_settings
      })
    } else {
      throw Error('Unable to find valid Sleeper league');
    }
  }
}
