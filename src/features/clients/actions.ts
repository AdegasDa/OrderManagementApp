import { getDb } from "@/lib/db";
import { clientSchema } from "./schema";
import type { Client } from "@/lib/types";

export async function getClients(): Promise<Client[]> {
  const db = await getDb();
  return db.select<Client[]>("SELECT * FROM clients ORDER BY name ASC");
}

export async function createClient(data: unknown) {
  const parsed = clientSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  const db = await getDb();
  const now = new Date().toISOString();
  await db.execute(
    "INSERT INTO clients (id, name, phone, source, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)",
    [crypto.randomUUID(), parsed.data.name, parsed.data.phone, parsed.data.source, now, now]
  );
  return { success: true };
}

export async function updateClient(id: string, data: unknown) {
  const parsed = clientSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  const db = await getDb();
  await db.execute(
    "UPDATE clients SET name=?, phone=?, source=?, updatedAt=? WHERE id=?",
    [parsed.data.name, parsed.data.phone, parsed.data.source, new Date().toISOString(), id]
  );
  return { success: true };
}

export async function deleteClient(id: string) {
  const db = await getDb();
  await db.execute("DELETE FROM clients WHERE id = ?", [id]);
  return { success: true };
}
