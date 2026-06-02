import { getDb } from "@/lib/db";
import { statusSchema } from "./schema";
import type { OrderStatus } from "@/lib/types";

export async function getOrderStatuses(): Promise<OrderStatus[]> {
  const db = await getDb();
  return db.select<OrderStatus[]>("SELECT * FROM order_statuses ORDER BY name ASC");
}

export async function createOrderStatus(data: unknown) {
  const parsed = statusSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  const db = await getDb();
  const now = new Date().toISOString();
  await db.execute(
    "INSERT INTO order_statuses (id, name, color, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)",
    [crypto.randomUUID(), parsed.data.name, parsed.data.color, now, now]
  );
  return { success: true };
}

export async function updateOrderStatus(id: string, data: unknown) {
  const parsed = statusSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  const db = await getDb();
  await db.execute(
    "UPDATE order_statuses SET name=?, color=?, updatedAt=? WHERE id=?",
    [parsed.data.name, parsed.data.color, new Date().toISOString(), id]
  );
  return { success: true };
}

export async function deleteOrderStatus(id: string) {
  const db = await getDb();
  await db.execute("DELETE FROM order_statuses WHERE id = ?", [id]);
  return { success: true };
}
