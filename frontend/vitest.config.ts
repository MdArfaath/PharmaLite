import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Vitest config. Scoped to *.test.ts(x) files and wired with the same "@/"
 * path alias as the app (tsconfig paths) so tests import modules the same way.
 * Node environment — the units under test (Zod schemas, pure mappers) don't
 * need a DOM.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
