import { getDb } from "@/lib/db";
import { orderSchema } from "./schema";
import type { OrderWithRelations, OrderPhoto } from "@/lib/types";

type FlatOrder = {
  id: string; orderNumber: number; orderDate: string;
  clientId: string; productId: string; paymentTypeId: string; statusId: string;
  totalValue: number; advanceAmount: number; deliveryFee: number;
  notes: string | null; deliveryNotes: string | null;
  createdAt: string; updatedAt: string;
  clientName: string; clientPhone: string; clientSource: string;
  productName: string; productDescription: string | null; productSalePrice: number;
  paymentTypeName: string;
  statusName: string; statusColor: string;
};

const ORDER_SELECT = `
  SELECT
    o.id, o.orderNumber, o.orderDate, o.clientId, o.productId, o.paymentTypeId, o.statusId,
    o.totalValue, o.advanceAmount, o.deliveryFee, o.notes, o.deliveryNotes, o.createdAt, o.updatedAt,
    c.name as clientName, c.phone as clientPhone, c.source as clientSource,
    p.name as productName, p.description as productDescription, p.salePrice as productSalePrice,
    pt.name as paymentTypeName,
    s.name as statusName, s.color as statusColor
  FROM orders o
  JOIN clients c ON o.clientId = c.id
  JOIN products p ON o.productId = p.id
  JOIN payment_types pt ON o.paymentTypeId = pt.id
  JOIN order_statuses s ON o.statusId = s.id
`;

const SORT_SQL: Record<string, string> = {
  "date-desc":   "o.orderDate DESC",
  "date-asc":    "o.orderDate ASC",
  "number-desc": "o.orderNumber DESC",
  "number-asc":  "o.orderNumber ASC",
  "total-desc":  "o.totalValue DESC",
  "total-asc":   "o.totalValue ASC",
};

function mapRow(row: FlatOrder, photos: OrderPhoto[] = []): OrderWithRelations {
  return {
    id: row.id, orderNumber: row.orderNumber, orderDate: row.orderDate,
    clientId: row.clientId, productId: row.productId, paymentTypeId: row.paymentTypeId,
    statusId: row.statusId, totalValue: row.totalValue, advanceAmount: row.advanceAmount,
    deliveryFee: row.deliveryFee, notes: row.notes, deliveryNotes: row.deliveryNotes,
    createdAt: row.createdAt, updatedAt: row.updatedAt,
    client:      { id: row.clientId,      name: row.clientName,      phone: row.clientPhone, source: row.clientSource, createdAt: "", updatedAt: "" },
    product:     { id: row.productId,     name: row.productName,     description: row.productDescription, salePrice: row.productSalePrice, createdAt: "", updatedAt: "" },
    paymentType: { id: row.paymentTypeId, name: row.paymentTypeName, createdAt: "", updatedAt: "" },
    status:      { id: row.statusId,      name: row.statusName,      color: row.statusColor, createdAt: "", updatedAt: "" },
    photos,
  };
}

export async function getOrders(filters?: {
  statusId?: string; orderNumber?: number;
  dateFrom?: string; dateTo?: string; sortBy?: string;
}) {
  const db = await getDb();
  const conds: string[] = [];
  const params: unknown[] = [];

  if (filters?.statusId)    { conds.push("o.statusId = ?");     params.push(filters.statusId); }
  if (filters?.orderNumber) { conds.push("o.orderNumber = ?");  params.push(filters.orderNumber); }
  if (filters?.dateFrom)    { conds.push("o.orderDate >= ?");   params.push(filters.dateFrom); }
  if (filters?.dateTo)      { conds.push("o.orderDate <= ?");   params.push(filters.dateTo); }

  const where   = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
  const orderBy = SORT_SQL[filters?.sortBy ?? "date-desc"] ?? SORT_SQL["date-desc"];

  const rows = await db.select<FlatOrder[]>(`${ORDER_SELECT} ${where} ORDER BY ${orderBy}`, params);
  return rows.map((r: FlatOrder) => mapRow(r));
}

export async function getOrderById(id: string) {
  const db = await getDb();
  const rows = await db.select<FlatOrder[]>(`${ORDER_SELECT} WHERE o.id = ?`, [id]);
  if (!rows.length) return null;
  const photos = await db.select<OrderPhoto[]>(
    "SELECT * FROM order_photos WHERE orderId = ? ORDER BY createdAt ASC",
    [id]
  );
  return mapRow(rows[0], photos);
}

export async function getOrdersByDate(date: string) {
  const db = await getDb();
  const rows = await db.select<FlatOrder[]>(
    `${ORDER_SELECT} WHERE o.orderDate = ? ORDER BY o.orderNumber ASC`,
    [date]
  );
  return rows.map((r: FlatOrder) => mapRow(r));
}

export async function getOrderCountsByMonth(year: number, month: number) {
  const db = await getDb();
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const rows = await db.select<{ day: string; count: number }[]>(
    `SELECT orderDate as day, COUNT(*) as count FROM orders WHERE orderDate >= ? AND orderDate <= ? GROUP BY orderDate`,
    [start, end]
  );

  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.day] = r.count;
  return counts;
}

async function nextOrderNumber(): Promise<number> {
  const db = await getDb();
  const rows = await db.select<[{ max: number | null }]>("SELECT MAX(orderNumber) as max FROM orders");
  return (rows[0]?.max ?? 0) + 1;
}

export async function createOrder(data: unknown, photoDataUrls: string[] = []) {
  const parsed = orderSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const db = await getDb();
  const id = crypto.randomUUID();
  const orderNumber = await nextOrderNumber();
  const now = new Date().toISOString();

  await db.execute(
    `INSERT INTO orders
      (id, orderNumber, orderDate, clientId, productId, paymentTypeId, statusId,
       totalValue, advanceAmount, deliveryFee, notes, deliveryNotes, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, orderNumber, parsed.data.orderDate, parsed.data.clientId, parsed.data.productId,
     parsed.data.paymentTypeId, parsed.data.statusId, parsed.data.totalValue,
     parsed.data.advanceAmount, parsed.data.deliveryFee, parsed.data.notes ?? null,
     parsed.data.deliveryNotes ?? null, now, now]
  );

  for (const filePath of photoDataUrls) {
    await db.execute(
      "INSERT INTO order_photos (id, orderId, filePath, createdAt) VALUES (?, ?, ?, ?)",
      [crypto.randomUUID(), id, filePath, now]
    );
  }

  return { success: true, id };
}

export async function updateOrder(id: string, data: unknown, newPhotoDataUrls: string[] = []) {
  const parsed = orderSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const db = await getDb();
  const now = new Date().toISOString();

  await db.execute(
    `UPDATE orders SET
      orderDate=?, clientId=?, productId=?, paymentTypeId=?, statusId=?,
      totalValue=?, advanceAmount=?, deliveryFee=?, notes=?, deliveryNotes=?, updatedAt=?
     WHERE id=?`,
    [parsed.data.orderDate, parsed.data.clientId, parsed.data.productId,
     parsed.data.paymentTypeId, parsed.data.statusId, parsed.data.totalValue,
     parsed.data.advanceAmount, parsed.data.deliveryFee, parsed.data.notes ?? null,
     parsed.data.deliveryNotes ?? null, now, id]
  );

  for (const filePath of newPhotoDataUrls) {
    await db.execute(
      "INSERT INTO order_photos (id, orderId, filePath, createdAt) VALUES (?, ?, ?, ?)",
      [crypto.randomUUID(), id, filePath, now]
    );
  }

  return { success: true };
}

export async function deleteOrder(id: string) {
  const db = await getDb();
  await db.execute("DELETE FROM orders WHERE id = ?", [id]);
  return { success: true };
}

export async function deleteOrderPhoto(id: string) {
  const db = await getDb();
  await db.execute("DELETE FROM order_photos WHERE id = ?", [id]);
  return { success: true };
}
