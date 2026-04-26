import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", "build", ".react-router"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["server/**/*.ts", "shared/**/*.ts"],
    },
  },
});
