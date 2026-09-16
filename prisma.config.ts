import { defineConfig, env } from "prisma/config";

// Prisma 7 no longer auto-loads .env. Node 22's loadEnvFile pulls it in so
// `env("DATABASE_URL")` below resolves for migrate/introspect commands.
try {
  process.loadEnvFile();
} catch {
  // No .env file present (e.g. CI with real env vars); ignore.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
