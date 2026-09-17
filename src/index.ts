import { env } from "./config/env.js";
import { prisma } from "./db/client.js";
import { startScheduler, stopScheduler } from "./jobs/scheduler.js";
import { buildServer } from "./server.js";

const app = buildServer();

async function start(): Promise<void> {
  try {
    await app.listen({ host: env.HOST, port: env.PORT });
    app.log.info(`fantasy-mcp listening on http://${env.HOST}:${env.PORT}/mcp`);
    await startScheduler();
    app.log.info("scheduler started");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

async function shutdown(signal: string): Promise<void> {
  app.log.info(`received ${signal}, shutting down`);
  await stopScheduler();
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    void shutdown(signal);
  });
}

void start();
