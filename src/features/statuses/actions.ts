"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { statusSchema } from "./schema";

export async function getOrderStatuses() {
  return prisma.orderStatus.findMany({ orderBy: { name: "asc" } });
}

export async function createOrderStatus(data: unknown) {
  const parsed = statusSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  await prisma.orderStatus.create({ data: parsed.data });
  revalidatePath("/statuses");
  return { success: true };
}

export async function updateOrderStatus(id: string, data: unknown) {
  const parsed = statusSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  await prisma.orderStatus.update({ where: { id }, data: parsed.data });
  revalidatePath("/statuses");
  return { success: true };
}

export async function deleteOrderStatus(id: string) {
  await prisma.orderStatus.delete({ where: { id } });
  revalidatePath("/statuses");
  return { success: true };
}
