import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["test/**/*.test.ts"],
    // These tests never touch the DB; give env validation a value so importing
    // the config layer doesn't fail. Real DB tests would use a live URL.
    env: {
      DATABASE_URL: "postgresql://fantasy:fantasy@localhost:5432/fantasy?schema=public",
    },
  },
});
