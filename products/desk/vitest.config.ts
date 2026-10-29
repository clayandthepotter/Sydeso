import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "domain",
          environment: "node",
          include: ["packages/domain/test/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "testing",
          environment: "node",
          include: ["packages/testing/test/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "app",
          environment: "node",
          include: ["apps/web/test/**/*.test.ts", "services/*/test/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "features",
          environment: "node",
          include: ["features/steps/**/*.steps.ts"],
        },
      },
      {
        plugins: [
          cloudflareTest(async () => ({
            miniflare: {
              compatibilityDate: "2026-10-01",
              compatibilityFlags: ["nodejs_compat"],
              d1Databases: { DB: "desk-events" },
              r2Buckets: ["RAW"],
              bindings: { TEST_MIGRATIONS: await readD1Migrations("migrations") },
            },
          })),
        ],
        test: {
          name: "workers",
          include: ["test/workers/**/*.test.ts"],
          setupFiles: ["test/workers/apply-migrations.ts"],
        },
      },
    ],
  },
});
