import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
    globalSetup: ["tests/global-setup.ts"],
    env: {
      CLAUDE_MOCK: "1",
      DATABASE_URL: "file:./test.db",
      AUTH_SECRET: "test-secret-test-secret-test-secret",
      LEO_ALLOW_SHORT_CALLS: "1",
    },
    fileParallelism: false,
  },
});
