import { getDb } from "@/lib/db";
import { paymentTypeSchema } from "./schema";
import type { PaymentType } from "@/lib/types";

export async function getPaymentTypes(): Promise<PaymentType[]> {
  const db = await getDb();
  return db.select<PaymentType[]>("SELECT * FROM payment_types ORDER BY name ASC");
}

export async function createPaymentType(data: unknown) {
  const parsed = paymentTypeSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  const db = await getDb();
  const now = new Date().toISOString();
  await db.execute(
    "INSERT INTO payment_types (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)",
    [crypto.randomUUID(), parsed.data.name, now, now]
  );
  return { success: true };
}

export async function updatePaymentType(id: string, data: unknown) {
  const parsed = paymentTypeSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  const db = await getDb();
  await db.execute(
    "UPDATE payment_types SET name=?, updatedAt=? WHERE id=?",
    [parsed.data.name, new Date().toISOString(), id]
  );
  return { success: true };
}

export async function deletePaymentType(id: string) {
  const db = await getDb();
  await db.execute("DELETE FROM payment_types WHERE id = ?", [id]);
  return { success: true };
}
