import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

// We fall back to a local sqlite file if Turso DB URL is not provided.
// This allows local automated tests (like Vitest / Playwright) to run flawlessly without needing the live internet.
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
