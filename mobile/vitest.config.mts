import { defineConfig } from "vitest/config";

/** Unit tests for mobile adapters; Expo native modules are replaced by fakes in test/fakes. */
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
