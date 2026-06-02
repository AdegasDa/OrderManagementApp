"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { productSchema } from "./schema";

export async function getProducts() {
  return prisma.product.findMany({ orderBy: { name: "asc" } });
}

export async function createProduct(data: unknown) {
  const parsed = productSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  await prisma.product.create({ data: parsed.data });
  revalidatePath("/products");
  return { success: true };
}

export async function updateProduct(id: string, data: unknown) {
  const parsed = productSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  await prisma.product.update({ where: { id }, data: parsed.data });
  revalidatePath("/products");
  return { success: true };
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } });
  revalidatePath("/products");
  return { success: true };
}
