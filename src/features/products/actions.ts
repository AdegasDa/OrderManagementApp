"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { productSchema } from "./schema";
import type { Product } from "@/lib/types";

function serialize(p: { id: string; name: string; description: string | null; salePrice: number; createdAt: Date; updatedAt: Date }): Product {
  return { ...p, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() };
}

const PAGE_SIZE = 50;

export async function getProducts(page = 0): Promise<{ items: Product[]; total: number }> {
  const [rows, total] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: "asc" }, take: PAGE_SIZE, skip: page * PAGE_SIZE }),
    prisma.product.count(),
  ]);
  return { items: rows.map(serialize), total };
}

/** Returns all products (id + name + salePrice) for form dropdowns — no pagination. */
export async function getAllProducts(): Promise<Pick<Product, "id" | "name" | "salePrice" | "description">[]> {
  return prisma.product.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, salePrice: true, description: true },
  });
}

export async function createProduct(data: unknown) {
  const parsed = productSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  try {
    await prisma.product.create({ data: { ...parsed.data, description: parsed.data.description || null } });
    revalidatePath("/products");
    return { success: true };
  } catch {
    return { error: "Erro ao guardar produto." };
  }
}

export async function updateProduct(id: string, data: unknown) {
  const parsed = productSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  try {
    await prisma.product.update({ where: { id }, data: { ...parsed.data, description: parsed.data.description || null } });
    revalidatePath("/products");
    return { success: true };
  } catch {
    return { error: "Erro ao atualizar produto." };
  }
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({ where: { id } });
    revalidatePath("/products");
    return { success: true };
  } catch {
    return { error: "Não é possível eliminar um produto que está associado a encomendas." };
  }
}

export async function restoreProduct(product: Product) {
  await prisma.product.upsert({
    where: { id: product.id },
    update: {},
    create: { id: product.id, name: product.name, description: product.description, salePrice: product.salePrice },
  });
  revalidatePath("/products");
  return { success: true };
}
