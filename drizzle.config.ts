import { defineConfig } from "drizzle-kit";

const url = process.env.TURSO_URL ?? "file:./local.db";
const isLocal = url.startsWith("file:");

export default defineConfig(
  isLocal
    ? {
        schema: "./server/db/schema.ts",
        out: "./server/db/migrations",
        dialect: "sqlite",
        dbCredentials: { url: url.replace(/^file:/, "") },
      }
    : {
        schema: "./server/db/schema.ts",
        out: "./server/db/migrations",
        dialect: "turso",
        dbCredentials: {
          url,
          authToken: process.env.TURSO_AUTH_TOKEN,
        },
      }
);
