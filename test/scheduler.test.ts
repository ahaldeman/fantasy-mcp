import { beforeEach, expect, it, vi } from "vitest";

const instance = {
  on: vi.fn(),
  start: vi.fn().mockResolvedValue(undefined),
  createQueue: vi.fn().mockResolvedValue(undefined),
  work: vi.fn().mockResolvedValue("worker-id"),
  schedule: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn().mockResolvedValue(undefined),
};
vi.mock("pg-boss", () => ({
  // A regular function so it can be called with `new`; returning an object
  // from a constructor overrides `this`.
  PgBoss: vi.fn(function () {
    return instance;
  }),
}));

import { PLAYERS_SYNC_QUEUE, startScheduler } from "../src/jobs/scheduler.js";

beforeEach(() => {
  vi.clearAllMocks();
});

it("starts pg-boss and registers the worker + schedule for the queue", async () => {
  await startScheduler();

  expect(instance.start).toHaveBeenCalledTimes(1);
  expect(instance.createQueue).toHaveBeenCalledWith(PLAYERS_SYNC_QUEUE);
  expect(instance.work).toHaveBeenCalledWith(PLAYERS_SYNC_QUEUE, expect.any(Function));
  expect(instance.schedule).toHaveBeenCalledWith(
    PLAYERS_SYNC_QUEUE,
    "0 9 * * *",
    {},
    { tz: "America/New_York" },
  );
});
