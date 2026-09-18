import { Prisma, type League } from "@prisma/client";

import { prisma } from "../../db/client.js";

export async function fetchLeagueSettings(leagueId: string): Promise<League | null> {
  return await prisma.league.findFirst({
    where: {
      id: leagueId,
    },
  });
}

export async function createLeagueSettings(
  league: Prisma.LeagueCreateInput,
): Promise<League> {
  return await prisma.league.create({ data: league });
}
