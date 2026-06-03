"use server";

import { prisma, toDate, fromDate } from "@/lib/prisma";
import { orderSchema } from "./schema";
import type { OrderWithRelations, OrderPhoto } from "@/lib/types";

const include = {
  client: true,
  product: true,
  paymentType: true,
  status: true,
  photos: { orderBy: { createdAt: "asc" as const } },
} as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOrder(o: any): OrderWithRelations {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    orderDate: fromDate(o.orderDate),
    clientId: o.clientId,
    productId: o.productId,
    paymentTypeId: o.paymentTypeId,
    statusId: o.statusId,
    totalValue: o.totalValue,
    advanceAmount: o.advanceAmount,
    deliveryFee: o.deliveryFee,
    notes: o.notes,
    deliveryNotes: o.deliveryNotes,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    client: { ...o.client, createdAt: o.client.createdAt.toISOString(), updatedAt: o.client.updatedAt.toISOString() },
    product: { ...o.product, createdAt: o.product.createdAt.toISOString(), updatedAt: o.product.updatedAt.toISOString() },
    paymentType: { ...o.paymentType, createdAt: o.paymentType.createdAt.toISOString(), updatedAt: o.paymentType.updatedAt.toISOString() },
    status: { ...o.status, createdAt: o.status.createdAt.toISOString(), updatedAt: o.status.updatedAt.toISOString() },
    photos: (o.photos as Array<OrderPhoto & { createdAt: Date | string }>).map((p) => ({
      ...p,
      createdAt: typeof p.createdAt === "object" ? (p.createdAt as Date).toISOString() : p.createdAt,
    })),
  };
}

const SORT_MAP: Record<string, object> = {
  "date-desc":   { orderDate: "desc" },
  "date-asc":    { orderDate: "asc" },
  "number-desc": { orderNumber: "desc" },
  "number-asc":  { orderNumber: "asc" },
  "total-desc":  { totalValue: "desc" },
  "total-asc":   { totalValue: "asc" },
};

export async function getOrders(filters?: {
  statusId?: string; orderNumber?: number;
  dateFrom?: string; dateTo?: string; sortBy?: string;
}): Promise<OrderWithRelations[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (filters?.statusId)    where.statusId    = filters.statusId;
  if (filters?.orderNumber) where.orderNumber = filters.orderNumber;
  if (filters?.dateFrom || filters?.dateTo) {
    where.orderDate = {};
    if (filters?.dateFrom) where.orderDate.gte = toDate(filters.dateFrom);
    if (filters?.dateTo)   where.orderDate.lte = new Date(filters.dateTo + "T23:59:59.999Z");
  }

  const orderBy = SORT_MAP[filters?.sortBy ?? "date-desc"] ?? SORT_MAP["date-desc"];
  const rows = await prisma.order.findMany({ where, orderBy, include });
  return rows.map(mapOrder);
}

export async function getOrderById(id: string): Promise<OrderWithRelations | null> {
  const o = await prisma.order.findUnique({ where: { id }, include });
  return o ? mapOrder(o) : null;
}

export async function getOrdersByDate(date: string): Promise<OrderWithRelations[]> {
  const rows = await prisma.order.findMany({
    where: {
      orderDate: {
        gte: toDate(date),
        lte: new Date(date + "T23:59:59.999Z"),
      },
    },
    orderBy: { orderNumber: "asc" },
    include,
  });
  return rows.map(mapOrder);
}

export async function getOrderCountsByMonth(year: number, month: number): Promise<Record<string, number>> {
  const start = toDate(`${year}-${String(month).padStart(2, "0")}-01`);
  const lastDay = new Date(year, month, 0).getDate();
  const end = new Date(`${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}T23:59:59.999Z`);

  const rows = await prisma.order.findMany({
    where: { orderDate: { gte: start, lte: end } },
    select: { orderDate: true },
  });

  const counts: Record<string, number> = {};
  for (const r of rows) {
    const day = fromDate(r.orderDate);
    counts[day] = (counts[day] ?? 0) + 1;
  }
  return counts;
}

async function nextOrderNumber(): Promise<number> {
  const last = await prisma.order.findFirst({ orderBy: { orderNumber: "desc" }, select: { orderNumber: true } });
  return (last?.orderNumber ?? 0) + 1;
}

export async function createOrder(data: unknown, photoDataUrls: string[] = []) {
  const parsed = orderSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const orderNumber = await nextOrderNumber();

  const order = await prisma.order.create({
    data: {
      orderNumber,
      orderDate: toDate(parsed.data.orderDate),
      clientId:      parsed.data.clientId,
      productId:     parsed.data.productId,
      paymentTypeId: parsed.data.paymentTypeId,
      statusId:      parsed.data.statusId,
      totalValue:    parsed.data.totalValue,
      advanceAmount: parsed.data.advanceAmount ?? 0,
      deliveryFee:   parsed.data.deliveryFee ?? 0,
      notes:         parsed.data.notes || null,
      deliveryNotes: parsed.data.deliveryNotes || null,
      photos: {
        create: photoDataUrls.map((filePath) => ({ filePath })),
      },
    },
  });

  return { success: true, id: order.id };
}

export async function updateOrder(id: string, data: unknown, newPhotoDataUrls: string[] = []) {
  const parsed = orderSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.order.update({
    where: { id },
    data: {
      orderDate:     toDate(parsed.data.orderDate),
      clientId:      parsed.data.clientId,
      productId:     parsed.data.productId,
      paymentTypeId: parsed.data.paymentTypeId,
      statusId:      parsed.data.statusId,
      totalValue:    parsed.data.totalValue,
      advanceAmount: parsed.data.advanceAmount ?? 0,
      deliveryFee:   parsed.data.deliveryFee ?? 0,
      notes:         parsed.data.notes || null,
      deliveryNotes: parsed.data.deliveryNotes || null,
      photos: newPhotoDataUrls.length > 0 ? {
        create: newPhotoDataUrls.map((filePath) => ({ filePath })),
      } : undefined,
    },
  });

  return { success: true };
}

export async function deleteOrder(id: string) {
  await prisma.order.delete({ where: { id } });
  return { success: true };
}

export async function deleteOrderPhoto(id: string) {
  await prisma.orderPhoto.delete({ where: { id } });
  return { success: true };
}
