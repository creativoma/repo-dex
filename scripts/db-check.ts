import { createClient } from "@libsql/client";

const url = process.env.TURSO_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) throw new Error("TURSO_URL env var is required");

const client = createClient({ url, authToken: url.startsWith("file:") ? undefined : authToken });

const result = await client.execute("PRAGMA table_info(resources)");

const columns = result.rows.map((r) => ({ cid: r[0], name: r[1], type: r[2], notnull: r[3] }));
console.table(columns);

client.close();
