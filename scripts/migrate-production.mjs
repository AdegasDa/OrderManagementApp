/**
 * Run this once to apply the socialHandle column to the production Turso DB.
 * Usage: node scripts/migrate-production.mjs
 * Requires DATABASE_URL and TURSO_AUTH_TOKEN to be set in the environment.
 */
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("ERROR: DATABASE_URL is not set");
  process.exit(1);
}

const db = createClient({ url, authToken });

async function run() {
  console.log("Connecting to:", url);

  // Check if column already exists
  const info = await db.execute("PRAGMA table_info(clients)");
  const hasColumn = info.rows.some((r) => r.name === "socialHandle");

  if (hasColumn) {
    console.log("✓ Column socialHandle already exists — nothing to do.");
    db.close();
    return;
  }

  await db.execute("ALTER TABLE clients ADD COLUMN socialHandle TEXT");
  console.log("✓ Added socialHandle column to clients table.");
  db.close();
}

run().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
