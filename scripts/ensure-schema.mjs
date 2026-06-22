/**
 * Applies any missing schema changes to the production libSQL/Turso database.
 * Runs during `npm run build` on Vercel before `next build`.
 * Skipped automatically for local SQLite file databases.
 */
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

if (!url) {
  console.log("[ensure-schema] DATABASE_URL not set — skipping.");
  process.exit(0);
}

if (url.startsWith("file:")) {
  console.log("[ensure-schema] Local SQLite file — skipping (use prisma db push locally).");
  process.exit(0);
}

const db = createClient({ url, authToken });

async function columnExists(table, col) {
  const r = await db.execute(`PRAGMA table_info("${table}")`);
  return r.rows.some((row) => row.name === col);
}

async function tableExists(table) {
  const r = await db.execute(
    `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
    [table]
  );
  return r.rows.length > 0;
}

async function run() {
  console.log("[ensure-schema] Connected to:", url.replace(/\/\/.*@/, "//***@"));

  // ── clients.socialHandle ──────────────────────────────────────────────────
  if (await tableExists("clients") && !(await columnExists("clients", "socialHandle"))) {
    await db.execute(`ALTER TABLE "clients" ADD COLUMN "socialHandle" TEXT`);
    console.log("[ensure-schema] ✓ Added clients.socialHandle");
  } else {
    console.log("[ensure-schema] ✓ clients.socialHandle already exists");
  }

  db.close();
  console.log("[ensure-schema] Done.");
}

run().catch((e) => {
  console.error("[ensure-schema] FAILED:", e.message);
  db.close();
  process.exit(1);
});
