import { expect, it } from "vitest";

import { toPlayerRow } from "../src/players/sync.js";
import type { SleeperRawPlayer } from "../src/sleeper/client.js";

it("maps a QB on a team", () => {
  const raw: SleeperRawPlayer = {
    first_name: "Joe",
    last_name: "Flacco",
    full_name: "Joe Flacco",
    search_full_name: "joeflacco",
    position: "QB",
    team: "CIN",
    fantasy_positions: ["QB"],
    status: "Active",
    injury_status: null,
    age: 41,
    years_exp: 18,
    number: 16,
    active: true,
  };
  expect(toPlayerRow("19", raw)).toEqual({
    id: "19",
    firstName: "Joe",
    lastName: "Flacco",
    fullName: "Joe Flacco",
    searchFullName: "joeflacco",
    position: "QB",
    team: "CIN",
    fantasyPositions: ["QB"],
    status: "Active",
    injuryStatus: null,
    age: 41,
    yearsExp: 18,
    number: 16,
    active: true,
  });
});

it("maps a free agent with a null team", () => {
  const row = toPlayerRow("999", { position: "WR", active: false });
  expect(row.team).toBeNull();
  expect(row.active).toBe(false);
});

it("maps a team defense with null names", () => {
  const row = toPlayerRow("CIN", {
    position: "DEF",
    team: "CIN",
    fantasy_positions: ["DEF"],
    active: true,
  });
  expect(row.firstName).toBeNull();
  expect(row.lastName).toBeNull();
  expect(row.fullName).toBeNull();
  expect(row.position).toBe("DEF");
});

it("defaults fantasyPositions and coerces missing numbers to null", () => {
  const row = toPlayerRow("empty", {});
  expect(row.fantasyPositions).toEqual([]);
  expect(row.age).toBeNull();
  expect(row.yearsExp).toBeNull();
  expect(row.number).toBeNull();
  expect(row.active).toBe(false);
});
