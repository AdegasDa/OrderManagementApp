import { getDb } from "@/lib/db";
import { productSchema } from "./schema";
import type { Product } from "@/lib/types";

export async function getProducts(): Promise<Product[]> {
  const db = await getDb();
  return db.select<Product[]>("SELECT * FROM products ORDER BY name ASC");
}

export async function createProduct(data: unknown) {
  const parsed = productSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  const db = await getDb();
  const now = new Date().toISOString();
  await db.execute(
    "INSERT INTO products (id, name, description, salePrice, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)",
    [crypto.randomUUID(), parsed.data.name, parsed.data.description ?? null, parsed.data.salePrice, now, now]
  );
  return { success: true };
}

export async function updateProduct(id: string, data: unknown) {
  const parsed = productSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  const db = await getDb();
  await db.execute(
    "UPDATE products SET name=?, description=?, salePrice=?, updatedAt=? WHERE id=?",
    [parsed.data.name, parsed.data.description ?? null, parsed.data.salePrice, new Date().toISOString(), id]
  );
  return { success: true };
}

export async function deleteProduct(id: string) {
  const db = await getDb();
  await db.execute("DELETE FROM products WHERE id = ?", [id]);
  return { success: true };
}
