import { createClient } from "@libsql/client";

const url = process.env.TURSO_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) throw new Error("TURSO_URL env var is required");

const client = createClient({ url, authToken: url.startsWith("file:") ? undefined : authToken });

const columns = await client.execute("PRAGMA table_info(resources)");
const names = columns.rows.map((r) => r[1] as string);

if (names.includes("language")) {
  await client.execute("ALTER TABLE resources DROP COLUMN language");
  console.log("✓ Dropped column: language");
} else {
  console.log("· language already removed");
}

if (names.includes("difficulty")) {
  await client.execute("ALTER TABLE resources DROP COLUMN difficulty");
  console.log("✓ Dropped column: difficulty");
} else {
  console.log("· difficulty already removed");
}

client.close();
