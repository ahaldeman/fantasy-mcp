import { prisma } from "../db/client.js";
import { syncPlayers } from "../players/sync.js";

// One-shot CLI: `npm run job:sync-players`. Runs the sync once and exits.
// Handy for manual runs and as the entrypoint for an external scheduler.
async function main(): Promise<void> {
  const { playerCount } = await syncPlayers();
  console.log(`players-sync completed: ${playerCount} players`);
}

try {
  await main();
  await prisma.$disconnect();
  process.exit(0);
} catch (err) {
  console.error("players-sync failed:", err);
  await prisma.$disconnect();
  process.exit(1);
}
