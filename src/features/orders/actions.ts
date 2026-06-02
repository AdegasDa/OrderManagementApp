"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { orderSchema } from "./schema";

const SORT_MAP: Record<string, object> = {
  "date-desc":   { orderDate: "desc" },
  "date-asc":    { orderDate: "asc" },
  "number-desc": { orderNumber: "desc" },
  "number-asc":  { orderNumber: "asc" },
  "total-desc":  { totalValue: "desc" },
  "total-asc":   { totalValue: "asc" },
};

export async function getOrders(filters?: {
  clientId?: string;
  statusId?: string;
  orderNumber?: number;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
}) {
  const orderBy = SORT_MAP[filters?.sortBy ?? "date-desc"] ?? SORT_MAP["date-desc"];

  return prisma.order.findMany({
    where: {
      ...(filters?.clientId && { clientId: filters.clientId }),
      ...(filters?.statusId && { statusId: filters.statusId }),
      ...(filters?.orderNumber && { orderNumber: filters.orderNumber }),
      ...(filters?.dateFrom || filters?.dateTo
        ? {
            orderDate: {
              ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
              ...(filters.dateTo && { lte: new Date(filters.dateTo) }),
            },
          }
        : {}),
    },
    include: {
      client: true,
      product: true,
      paymentType: true,
      status: true,
      photos: true,
    },
    orderBy,
  });
}

export async function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: { client: true, product: true, paymentType: true, status: true, photos: true },
  });
}

export async function getOrdersByDate(date: string) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return prisma.order.findMany({
    where: { orderDate: { gte: start, lte: end } },
    include: { client: true, product: true, status: true },
    orderBy: { orderNumber: "asc" },
  });
}

export async function getOrderCountsByMonth(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);
  const orders = await prisma.order.findMany({
    where: { orderDate: { gte: start, lte: end } },
    select: { orderDate: true },
  });
  const counts: Record<string, number> = {};
  for (const o of orders) {
    const key = o.orderDate.toISOString().slice(0, 10);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

async function nextOrderNumber(): Promise<number> {
  const last = await prisma.order.findFirst({ orderBy: { orderNumber: "desc" }, select: { orderNumber: true } });
  return (last?.orderNumber ?? 0) + 1;
}

export async function createOrder(data: unknown, photoFilePaths: string[] = []) {
  const parsed = orderSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  const orderNumber = await nextOrderNumber();
  const order = await prisma.order.create({
    data: {
      ...parsed.data,
      orderDate: new Date(parsed.data.orderDate),
      orderNumber,
      photos: photoFilePaths.length
        ? { create: photoFilePaths.map((filePath) => ({ filePath })) }
        : undefined,
    },
  });
  revalidatePath("/orders");
  revalidatePath("/agenda");
  return { success: true, id: order.id };
}

export async function updateOrder(id: string, data: unknown, newPhotoFilePaths: string[] = []) {
  const parsed = orderSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  await prisma.order.update({
    where: { id },
    data: {
      ...parsed.data,
      orderDate: new Date(parsed.data.orderDate),
      ...(newPhotoFilePaths.length && {
        photos: { create: newPhotoFilePaths.map((filePath) => ({ filePath })) },
      }),
    },
  });
  revalidatePath("/orders");
  revalidatePath("/agenda");
  return { success: true };
}

export async function deleteOrder(id: string) {
  await prisma.order.delete({ where: { id } });
  revalidatePath("/orders");
  revalidatePath("/agenda");
  return { success: true };
}

export async function deleteOrderPhoto(id: string) {
  await prisma.orderPhoto.delete({ where: { id } });
  return { success: true };
}
