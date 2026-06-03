"use server";

import { prisma } from "@/lib/prisma";
import { paymentTypeSchema } from "./schema";
import type { PaymentType } from "@/lib/types";

function serialize(p: { id: string; name: string; createdAt: Date; updatedAt: Date }): PaymentType {
  return { ...p, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() };
}

export async function getPaymentTypes(): Promise<PaymentType[]> {
  const rows = await prisma.paymentType.findMany({ orderBy: { name: "asc" } });
  return rows.map(serialize);
}

export async function createPaymentType(data: unknown) {
  const parsed = paymentTypeSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  try {
    await prisma.paymentType.create({ data: parsed.data });
    return { success: true };
  } catch {
    return { error: "Já existe um tipo de pagamento com este nome." };
  }
}

export async function updatePaymentType(id: string, data: unknown) {
  const parsed = paymentTypeSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  try {
    await prisma.paymentType.update({ where: { id }, data: parsed.data });
    return { success: true };
  } catch {
    return { error: "Já existe um tipo de pagamento com este nome." };
  }
}

export async function deletePaymentType(id: string) {
  await prisma.paymentType.delete({ where: { id } });
  return { success: true };
}

export async function restorePaymentType(paymentType: PaymentType) {
  try {
    await prisma.paymentType.upsert({
      where: { id: paymentType.id },
      update: {},
      create: { id: paymentType.id, name: paymentType.name },
    });
  } catch { /* name conflict — ignore */ }
  return { success: true };
}
