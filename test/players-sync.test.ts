import { beforeEach, expect, it, vi } from "vitest";

vi.mock("../src/sleeper/client.js", () => ({
  getAllPlayers: vi.fn(),
}));

const tx = {
  player: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
};
vi.mock("../src/db/client.js", () => ({
  prisma: {
    playerSnapshot: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(async (cb: (t: typeof tx) => Promise<unknown>) => cb(tx)),
  },
}));

import { syncPlayers } from "../src/features/players/sync.js";
import { prisma } from "../src/db/client.js";
import { getAllPlayers } from "../src/sleeper/client.js";

const getPlayers = vi.mocked(getAllPlayers);
const snapshotUpsert = vi.mocked(prisma.playerSnapshot.upsert);
const snapshotDeleteMany = vi.mocked(prisma.playerSnapshot.deleteMany);

beforeEach(() => {
  vi.clearAllMocks();
});

it("snapshots the payload, refreshes players, and prunes old snapshots", async () => {
  getPlayers.mockResolvedValue({
    "19": { first_name: "Joe", last_name: "Flacco", position: "QB", team: "CIN", active: true },
    CIN: { position: "DEF", team: "CIN", active: true },
  });

  const result = await syncPlayers();
  expect(result.playerCount).toBe(2);

  // Backup snapshot with the count.
  expect(snapshotUpsert).toHaveBeenCalledTimes(1);
  expect(snapshotUpsert.mock.calls[0]?.[0].create.playerCount).toBe(2);

  // Atomic refresh: clear then bulk insert the mapped rows.
  expect(tx.player.deleteMany).toHaveBeenCalledTimes(1);
  expect(tx.player.createMany).toHaveBeenCalledTimes(1);
  const inserted = tx.player.createMany.mock.calls[0]?.[0].data;
  expect(inserted).toHaveLength(2);
  expect(inserted[0]).toMatchObject({ id: "19", fullName: null, position: "QB" });

  // Retention prune runs with a cutoff filter.
  expect(snapshotDeleteMany).toHaveBeenCalledTimes(1);
  expect(snapshotDeleteMany.mock.calls[0]?.[0].where.capturedOn).toHaveProperty("lt");
});
