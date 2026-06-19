import "dotenv/config";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  // Check actual columns on orders table
  const info = await client.execute(`PRAGMA table_info(orders)`);
  const cols = info.rows.map(r => r.name as string);
  console.log("Orders columns:", cols);

  const hasProductId = cols.includes("productId");
  const tableExists = (await client.execute(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='order_products'`
  )).rows.length > 0;

  console.log("order_products exists:", tableExists);
  console.log("productId column exists:", hasProductId);

  if (!tableExists) {
    console.log("Creating order_products table...");
    await client.execute(`
      CREATE TABLE "order_products" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "orderId" TEXT NOT NULL,
        "productId" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL DEFAULT 1,
        CONSTRAINT "order_products_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "order_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);
    console.log("✓ Created order_products");
  }

  if (tableExists && hasProductId) {
    // migrate data
    const existing = await client.execute(`SELECT COUNT(*) as cnt FROM order_products`);
    const count = existing.rows[0].cnt as number;
    if (count === 0) {
      console.log("Migrating existing product data...");
      await client.execute(`
        INSERT INTO "order_products" ("id", "orderId", "productId", "quantity")
        SELECT lower(hex(randomblob(9))), "id", "productId", 1 FROM "orders"
      `);
      console.log("✓ Migrated product data");
    } else {
      console.log(`order_products already has ${count} rows, skipping data migration`);
    }
  }

  if (hasProductId) {
    console.log("Recreating orders table without productId (SQLite FK workaround)...");
    await client.execute(`PRAGMA foreign_keys = OFF`);
    await client.execute(`
      CREATE TABLE "orders_new" (
        "id"            TEXT NOT NULL PRIMARY KEY,
        "orderNumber"   INTEGER NOT NULL,
        "orderDate"     DATETIME NOT NULL,
        "clientId"      TEXT NOT NULL,
        "paymentTypeId" TEXT NOT NULL,
        "statusId"      TEXT NOT NULL,
        "totalValue"    REAL NOT NULL,
        "advanceAmount" REAL NOT NULL DEFAULT 0,
        "deliveryFee"   REAL NOT NULL DEFAULT 0,
        "notes"         TEXT,
        "deliveryNotes" TEXT,
        "createdAt"     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"     DATETIME NOT NULL,
        CONSTRAINT "orders_clientId_fkey"      FOREIGN KEY ("clientId")      REFERENCES "clients" ("id"),
        CONSTRAINT "orders_paymentTypeId_fkey" FOREIGN KEY ("paymentTypeId") REFERENCES "payment_types" ("id"),
        CONSTRAINT "orders_statusId_fkey"      FOREIGN KEY ("statusId")      REFERENCES "order_statuses" ("id")
      )
    `);
    await client.execute(`
      INSERT INTO orders_new (id, orderNumber, orderDate, clientId, paymentTypeId, statusId, totalValue, advanceAmount, deliveryFee, notes, deliveryNotes, createdAt, updatedAt)
      SELECT id, orderNumber, orderDate, clientId, paymentTypeId, statusId, totalValue, advanceAmount, deliveryFee, notes, deliveryNotes, createdAt, updatedAt
      FROM orders
    `);
    await client.execute(`DROP TABLE orders`);
    await client.execute(`ALTER TABLE orders_new RENAME TO orders`);
    await client.execute(`CREATE UNIQUE INDEX IF NOT EXISTS "orders_orderNumber_key" ON orders(orderNumber)`);
    await client.execute(`PRAGMA foreign_keys = ON`);
    console.log("✓ Removed productId column from orders");
  } else {
    console.log("productId column already removed, nothing to do");
  }

  console.log("Migration complete!");
}

main().catch((e) => { console.error(e); process.exit(1); });
