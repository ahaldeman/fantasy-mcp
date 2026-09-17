import type { Player } from "@prisma/client";

import { prisma } from "../../db/client.js";

// Look up curated players by Sleeper id, keyed by id so callers can join them
// onto a roster's id list. Ids with no synced row are simply absent from the
// map (team defenses and just-added players can miss).
export async function getPlayersByIds(
  ids: string[],
): Promise<Map<string, Player>> {
  if (ids.length === 0) {
    return new Map();
  }
  const players = await prisma.player.findMany({ where: { id: { in: ids } } });
  return new Map(players.map((player) => [player.id, player]));
}
