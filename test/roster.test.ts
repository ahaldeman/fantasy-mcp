import { beforeEach, expect, it, vi } from "vitest";
import type { Player } from "@prisma/client";

vi.mock("../src/sleeper/client.js", () => ({ getRosters: vi.fn() }));
vi.mock("../src/features/players/repository.js", () => ({
  getPlayersByIds: vi.fn(),
}));

import { buildMyRoster } from "../src/features/roster/tools.js";
import { getRosters } from "../src/sleeper/client.js";
import { getPlayersByIds } from "../src/features/players/repository.js";
import type { AuthUser } from "../src/features/auth/authenticate.js";

const getRostersMock = vi.mocked(getRosters);
const getPlayers = vi.mocked(getPlayersByIds);

const authUser: AuthUser = {
  id: "u1",
  firstName: "Alex",
  lastName: "H",
  email: "alex@example.com",
  sleeperUserId: "U1",
  sleeperUsername: "alexh",
  sleeperLeagueId: "L1",
  displayName: "AlexH",
};

function player(over: Partial<Player>): Player {
  return {
    id: "",
    firstName: null,
    lastName: null,
    fullName: null,
    searchFullName: null,
    position: null,
    team: null,
    fantasyPositions: [],
    status: null,
    injuryStatus: null,
    age: null,
    yearsExp: null,
    number: null,
    active: true,
    updatedAt: new Date(),
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

it("returns null when no roster in the league belongs to the user", async () => {
  getRostersMock.mockResolvedValue([
    { roster_id: 1, owner_id: "OTHER", players: ["1"], starters: ["1"], injuredReserve: [], taxiSquad: [] },
  ]);
  getPlayers.mockResolvedValue(new Map());
  expect(await buildMyRoster(authUser)).toBeNull();
});

it("groups starters, bench, IR, and taxi, dropping empty starter slots", async () => {
  getRostersMock.mockResolvedValue([
    {
      roster_id: 7,
      owner_id: "U1",
      players: ["1", "2", "3", "4", "5"],
      starters: ["1", "0", "2"],
      injuredReserve: ["4"],
      taxiSquad: ["5"],
    },
    { roster_id: 8, owner_id: "OTHER", players: [], starters: [], injuredReserve: [], taxiSquad: [] },
  ]);
  getPlayers.mockResolvedValue(
    new Map<string, Player>([
      ["1", player({ id: "1", fullName: "QB One", position: "QB", team: "CIN", injuryStatus: "Questionable" })],
      ["2", player({ id: "2", fullName: "RB Two", position: "RB", team: "BUF" })],
      ["3", player({ id: "3", fullName: "WR Three", position: "WR", team: "KC" })],
      ["4", player({ id: "4", fullName: "TE Four", position: "TE", team: "SF" })],
      ["5", player({ id: "5", fullName: "WR Five", position: "WR", team: "LAR" })],
    ]),
  );

  const roster = await buildMyRoster(authUser);
  expect(roster).not.toBeNull();
  expect(roster?.rosterId).toBe(7);
  // The "0" slot is dropped from starters.
  expect(roster?.starters.map((p) => p.id)).toEqual(["1", "2"]);
  expect(roster?.starters[0]).toMatchObject({
    name: "QB One",
    position: "QB",
    team: "CIN",
    injuryStatus: "Questionable",
  });
  // Bench excludes the IR and taxi players even though players[] contains them.
  expect(roster?.bench.map((p) => p.id)).toEqual(["3"]);
  expect(roster?.injuredReserve.map((p) => p.id)).toEqual(["4"]);
  expect(roster?.taxiSquad.map((p) => p.id)).toEqual(["5"]);
  // The join is asked for every non-empty roster id.
  expect(getPlayers).toHaveBeenCalledWith(["1", "2", "3", "4", "5"]);
});

it("falls back to the id as the name when the player isn't synced", async () => {
  getRostersMock.mockResolvedValue([
    { roster_id: 1, owner_id: "U1", players: ["CIN"], starters: ["CIN"], injuredReserve: [], taxiSquad: [] },
  ]);
  getPlayers.mockResolvedValue(new Map());

  const roster = await buildMyRoster(authUser);
  expect(roster?.starters[0]).toMatchObject({ id: "CIN", name: "CIN", position: null });
});
