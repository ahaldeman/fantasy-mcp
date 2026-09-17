import { Prisma } from "@prisma/client";

import { env } from "../../config/env.js";
import { prisma } from "../../db/client.js";
import { getAllPlayers } from "../../sleeper/client.js";
import type { SleeperRawPlayer } from "../../sleeper/types.js";

const CHUNK_SIZE = 1000;
const TRANSACTION_TIMEOUT_MS = 60_000;

function intOrNull(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.trunc(value)
    : null;
}

// Map one raw Sleeper player to a curated row. Pure and tested.
export function toPlayerRow(
  id: string,
  raw: SleeperRawPlayer,
): Prisma.PlayerCreateManyInput {
  return {
    id,
    firstName: raw.first_name ?? null,
    lastName: raw.last_name ?? null,
    fullName: raw.full_name ?? null,
    searchFullName: raw.search_full_name ?? null,
    position: raw.position ?? null,
    team: raw.team ?? null,
    fantasyPositions: raw.fantasy_positions ?? [],
    status: raw.status ?? null,
    injuryStatus: raw.injury_status ?? null,
    age: intOrNull(raw.age),
    yearsExp: intOrNull(raw.years_exp),
    number: intOrNull(raw.number),
    active: raw.active === true,
  };
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

function startOfUtcToday(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// Fetch the full players payload, back it up as a dated snapshot, and refresh
// the Player table to mirror it. Idempotent within a day.
export async function syncPlayers(): Promise<{ playerCount: number }> {
  const players = await getAllPlayers();
  const rows = Object.entries(players).map(([id, raw]) => toPlayerRow(id, raw));
  const capturedOn = startOfUtcToday();

  await prisma.playerSnapshot.upsert({
    where: { capturedOn },
    create: {
      capturedOn,
      source: "sleeper",
      playerCount: rows.length,
      payload: players as Prisma.InputJsonValue,
    },
    update: {
      source: "sleeper",
      playerCount: rows.length,
      payload: players as Prisma.InputJsonValue,
    },
  });

  // Atomic swap: readers see the previous set until this commits.
  await prisma.$transaction(
    async (tx) => {
      await tx.player.deleteMany();
      for (const batch of chunk(rows, CHUNK_SIZE)) {
        await tx.player.createMany({ data: batch });
      }
    },
    { timeout: TRANSACTION_TIMEOUT_MS },
  );

  const cutoff = new Date(capturedOn);
  cutoff.setUTCDate(cutoff.getUTCDate() - env.PLAYERS_SNAPSHOT_RETENTION_DAYS);
  await prisma.playerSnapshot.deleteMany({ where: { capturedOn: { lt: cutoff } } });

  return { playerCount: rows.length };
}
