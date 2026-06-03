"use server";

import { prisma } from "@/lib/prisma";
import { statusSchema } from "./schema";
import type { OrderStatus } from "@/lib/types";

function serialize(s: { id: string; name: string; color: string; createdAt: Date; updatedAt: Date }): OrderStatus {
  return { ...s, createdAt: s.createdAt.toISOString(), updatedAt: s.updatedAt.toISOString() };
}

export async function getOrderStatuses(): Promise<OrderStatus[]> {
  const rows = await prisma.orderStatus.findMany({ orderBy: { name: "asc" } });
  return rows.map(serialize);
}

export async function createOrderStatus(data: unknown) {
  const parsed = statusSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  try {
    await prisma.orderStatus.create({ data: parsed.data });
    return { success: true };
  } catch {
    return { error: "Já existe um estado com este nome." };
  }
}

export async function updateOrderStatus(id: string, data: unknown) {
  const parsed = statusSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  try {
    await prisma.orderStatus.update({ where: { id }, data: parsed.data });
    return { success: true };
  } catch {
    return { error: "Já existe um estado com este nome." };
  }
}

export async function deleteOrderStatus(id: string) {
  await prisma.orderStatus.delete({ where: { id } });
  return { success: true };
}

export async function restoreOrderStatus(status: OrderStatus) {
  try {
    await prisma.orderStatus.upsert({
      where: { id: status.id },
      update: {},
      create: { id: status.id, name: status.name, color: status.color },
    });
  } catch { /* name conflict — ignore */ }
  return { success: true };
}
