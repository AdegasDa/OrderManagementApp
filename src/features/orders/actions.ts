"use server";

import { del } from "@vercel/blob";
import { prisma, toDate, fromDate } from "@/lib/prisma";
import { orderSchema, quickFieldsSchema } from "./schema";
import type { OrderWithRelations, OrderPhoto, OrderProduct } from "@/lib/types";

const include = {
  client:        true,
  orderProducts: { include: { product: true } },
  paymentType:   true,
  status:        true,
  photos:        { orderBy: { createdAt: "asc" as const } },
} as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOrder(o: any): OrderWithRelations {
  return {
    id:            o.id,
    orderNumber:   o.orderNumber,
    orderDate:     fromDate(o.orderDate),
    clientId:      o.clientId,
    paymentTypeId: o.paymentTypeId,
    statusId:      o.statusId,
    totalValue:    o.totalValue,
    advanceAmount: o.advanceAmount,
    deliveryFee:   o.deliveryFee,
    pickupHour:    o.pickupHour ?? null,
    notes:         o.notes,
    deliveryNotes: o.deliveryNotes,
    createdAt:     o.createdAt.toISOString(),
    updatedAt:     o.updatedAt.toISOString(),
    client:      { ...o.client,      createdAt: o.client.createdAt.toISOString(),      updatedAt: o.client.updatedAt.toISOString() },
    paymentType: { ...o.paymentType, createdAt: o.paymentType.createdAt.toISOString(), updatedAt: o.paymentType.updatedAt.toISOString() },
    status:      { ...o.status,      createdAt: o.status.createdAt.toISOString(),      updatedAt: o.status.updatedAt.toISOString() },
    orderProducts: (o.orderProducts as Array<OrderProduct & { product: { createdAt: Date; updatedAt: Date } }>).map((op) => ({
      id:        op.id,
      orderId:   op.orderId,
      productId: op.productId,
      quantity:  op.quantity,
      product:   { ...op.product, createdAt: op.product.createdAt.toISOString(), updatedAt: op.product.updatedAt.toISOString() },
    })),
    photos: (o.photos as Array<OrderPhoto & { createdAt: Date | string }>).map((p) => ({
      ...p,
      createdAt: typeof p.createdAt === "object" ? (p.createdAt as Date).toISOString() : p.createdAt,
    })),
  };
}

const SORT_MAP: Record<string, object> = {
  "time-asc": { pickupHour: "asc" },
  "status":   { status: { name: "asc" } },
};

export async function getOrders(filters?: {
  statusId?: string; orderNumber?: number;
  dateFrom?: string; dateTo?: string; sortBy?: string;
  clientName?: string;
}): Promise<OrderWithRelations[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (filters?.statusId)    where.statusId    = filters.statusId;
  if (filters?.orderNumber) where.orderNumber = filters.orderNumber;
  if (filters?.clientName)  where.client      = { name: { contains: filters.clientName } };
  if (filters?.dateFrom || filters?.dateTo) {
    where.orderDate = {};
    if (filters?.dateFrom) where.orderDate.gte = toDate(filters.dateFrom);
    if (filters?.dateTo)   where.orderDate.lte = new Date(filters.dateTo + "T23:59:59.999Z");
  }

  const orderBy = SORT_MAP[filters?.sortBy ?? "time-asc"] ?? SORT_MAP["time-asc"];
  const rows = await prisma.order.findMany({ where, orderBy, include, take: 200 });
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

export async function getOrdersForWeek(days: string[]): Promise<OrderWithRelations[]> {
  if (days.length === 0) return [];
  const rows = await prisma.order.findMany({
    where: {
      orderDate: {
        gte: toDate(days[0]),
        lte: new Date(days[days.length - 1] + "T23:59:59.999Z"),
      },
    },
    orderBy: { orderDate: "asc" },
    include,
  });
  return rows.map(mapOrder);
}

export async function createOrder(data: unknown, photoDataUrls: string[] = []) {
  const parsed = orderSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  // Use a transaction to atomically read the current max orderNumber and create the order,
  // preventing race conditions with concurrent submissions.
  const order = await prisma.$transaction(async (tx) => {
    const last = await tx.order.findFirst({ orderBy: { orderNumber: "desc" }, select: { orderNumber: true } });
    const orderNumber = (last?.orderNumber ?? 0) + 1;

    return tx.order.create({
      data: {
        orderNumber,
        orderDate:     toDate(parsed.data.orderDate),
        clientId:      parsed.data.clientId,
        paymentTypeId: parsed.data.paymentTypeId,
        statusId:      parsed.data.statusId,
        totalValue:    parsed.data.totalValue,
        advanceAmount: parsed.data.advanceAmount ?? 0,
        deliveryFee:   parsed.data.deliveryFee ?? 0,
        notes:         parsed.data.notes || null,
        deliveryNotes: parsed.data.deliveryNotes || null,
        orderProducts: {
          create: parsed.data.products.map(({ productId, quantity }) => ({ productId, quantity })),
        },
        photos: {
          create: photoDataUrls.map((filePath) => ({ filePath })),
        },
      },
    });
  });

  return { success: true, id: order.id };
}

export async function updateOrder(id: string, data: unknown, newPhotoDataUrls: string[] = []) {
  const parsed = orderSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.orderProduct.deleteMany({ where: { orderId: id } });

  await prisma.order.update({
    where: { id },
    data: {
      orderDate:     toDate(parsed.data.orderDate),
      clientId:      parsed.data.clientId,
      paymentTypeId: parsed.data.paymentTypeId,
      statusId:      parsed.data.statusId,
      totalValue:    parsed.data.totalValue,
      advanceAmount: parsed.data.advanceAmount ?? 0,
      deliveryFee:   parsed.data.deliveryFee ?? 0,
      notes:         parsed.data.notes || null,
      deliveryNotes: parsed.data.deliveryNotes || null,
      orderProducts: {
        create: parsed.data.products.map(({ productId, quantity }) => ({ productId, quantity })),
      },
      photos: newPhotoDataUrls.length > 0 ? {
        create: newPhotoDataUrls.map((filePath) => ({ filePath })),
      } : undefined,
    },
  });

  return { success: true };
}

export async function deleteOrder(id: string) {
  // Delete blobs before removing the DB record to avoid orphaned files
  const photos = await prisma.orderPhoto.findMany({ where: { orderId: id }, select: { filePath: true } });
  const blobUrls = photos.map((p) => p.filePath).filter((u) => u.startsWith("https://"));
  if (blobUrls.length > 0) {
    await del(blobUrls).catch((err) => console.error("[deleteOrder] blob delete error:", err));
  }

  await prisma.order.delete({ where: { id } });
  return { success: true };
}

export async function deleteOrderPhoto(id: string) {
  const photo = await prisma.orderPhoto.findUnique({ where: { id }, select: { filePath: true } });
  await prisma.orderPhoto.delete({ where: { id } });
  if (photo?.filePath && photo.filePath.startsWith("https://")) {
    await del(photo.filePath).catch(() => {});
  }
  return { success: true };
}

export async function updateOrderDay(id: string, newDate: string) {
  await prisma.order.update({ where: { id }, data: { orderDate: toDate(newDate) } });
  return { success: true };
}

export async function updateOrderQuickFields(
  id: string,
  fields: { pickupHour?: string | null; statusId?: string }
) {
  // Validate against an explicit allowlist schema — never pass raw client fields to Prisma
  const parsed = quickFieldsSchema.safeParse(fields);
  if (!parsed.success) return { error: "Dados inválidos." };

  const data: { pickupHour?: string | null; statusId?: string } = {};
  if ("pickupHour" in parsed.data) data.pickupHour = parsed.data.pickupHour ?? null;
  if (parsed.data.statusId)        data.statusId   = parsed.data.statusId;

  await prisma.order.update({ where: { id }, data });
  return { success: true };
}
