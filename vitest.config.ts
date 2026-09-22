import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: { lines: 70, functions: 70, statements: 70, branches: 60 },
      exclude: ["src/ui/handlers/**", "src/commands/**", "src/index.ts"],
    },
    pool: "forks",
    poolOptions: { forks: { singleFork: false } },
  },
});
