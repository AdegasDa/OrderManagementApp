import Database from "@tauri-apps/plugin-sql";

let _db: Database | null = null;

const TABLES = [
  `CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'STORE',
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    salePrice REAL NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS payment_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS order_statuses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#6b7280',
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    orderNumber INTEGER NOT NULL UNIQUE,
    orderDate TEXT NOT NULL,
    clientId TEXT NOT NULL REFERENCES clients(id),
    productId TEXT NOT NULL REFERENCES products(id),
    paymentTypeId TEXT NOT NULL REFERENCES payment_types(id),
    statusId TEXT NOT NULL REFERENCES order_statuses(id),
    totalValue REAL NOT NULL,
    advanceAmount REAL NOT NULL DEFAULT 0,
    deliveryFee REAL NOT NULL DEFAULT 0,
    notes TEXT,
    deliveryNotes TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS order_photos (
    id TEXT PRIMARY KEY,
    orderId TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    filePath TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
];

const SEED = [
  `INSERT OR IGNORE INTO payment_types (id, name) VALUES ('pt-numerario', 'Numerário')`,
  `INSERT OR IGNORE INTO payment_types (id, name) VALUES ('pt-cartao', 'Cartão')`,
  `INSERT OR IGNORE INTO payment_types (id, name) VALUES ('pt-transferencia', 'Transferência')`,
  `INSERT OR IGNORE INTO payment_types (id, name) VALUES ('pt-mbway', 'MB Way')`,
  `INSERT OR IGNORE INTO order_statuses (id, name, color) VALUES ('st-novo', 'Novo', '#3b82f6')`,
  `INSERT OR IGNORE INTO order_statuses (id, name, color) VALUES ('st-progresso', 'Em Progresso', '#f59e0b')`,
  `INSERT OR IGNORE INTO order_statuses (id, name, color) VALUES ('st-pronto', 'Pronto', '#10b981')`,
  `INSERT OR IGNORE INTO order_statuses (id, name, color) VALUES ('st-entregue', 'Entregue', '#6b7280')`,
  `INSERT OR IGNORE INTO order_statuses (id, name, color) VALUES ('st-cancelado', 'Cancelado', '#ef4444')`,
];

export async function getDb(): Promise<Database> {
  if (_db) return _db;
  _db = await Database.load("sqlite:orderapp.db");
  for (const stmt of TABLES) await _db.execute(stmt);
  for (const stmt of SEED) await _db.execute(stmt);
  return _db;
}
