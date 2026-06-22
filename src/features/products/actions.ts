"use server";

import { prisma } from "@/lib/prisma";
import { productSchema } from "./schema";
import type { Product } from "@/lib/types";

function serialize(p: { id: string; name: string; description: string | null; salePrice: number; createdAt: Date; updatedAt: Date }): Product {
  return { ...p, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() };
}

export async function getProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({ orderBy: { name: "asc" } });
  return rows.map(serialize);
}

export async function createProduct(data: unknown) {
  const parsed = productSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  try {
    await prisma.product.create({ data: { ...parsed.data, description: parsed.data.description || null } });
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
    return { success: true };
  } catch {
    return { error: "Erro ao atualizar produto." };
  }
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({ where: { id } });
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
  return { success: true };
}
