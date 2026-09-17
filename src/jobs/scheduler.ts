import { PgBoss } from "pg-boss";

import { env } from "../config/env.js";
import { syncPlayers } from "../features/players/sync.js";

export const PLAYERS_SYNC_QUEUE = "players-sync";

// Lifecycle state: null until started. Every app instance runs this; pg-boss
// coordinates through Postgres so exactly one instance runs each fired job.
let boss: PgBoss | null = null;

export async function startScheduler(): Promise<void> {
  boss = new PgBoss(env.DATABASE_URL);
  boss.on("error", (err) => console.error("pg-boss error:", err));

  await boss.start();
  await boss.createQueue(PLAYERS_SYNC_QUEUE);

  await boss.work(PLAYERS_SYNC_QUEUE, async () => {
    const { playerCount } = await syncPlayers();
    console.log(`players-sync completed: ${playerCount} players`);
  });

  // Idempotent across instances: one schedule row for the queue.
  await boss.schedule(
    PLAYERS_SYNC_QUEUE,
    env.PLAYERS_SYNC_CRON,
    {},
    { tz: env.PLAYERS_SYNC_TZ },
  );
}

export async function stopScheduler(): Promise<void> {
  if (boss !== null) {
    await boss.stop();
    boss = null;
  }
}
