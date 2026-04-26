import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (_db) return _db;

  const url = process.env.TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) throw new Error("TURSO_URL env var is required");

  const isLocal = url.startsWith("file:");
  const client = createClient({ url, authToken: isLocal ? undefined : authToken });
  _db = drizzle(client, { schema });
  return _db;
}
