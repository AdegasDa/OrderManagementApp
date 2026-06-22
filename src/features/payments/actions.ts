"use server";

import { revalidatePath } from "next/cache";
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
    revalidatePath("/payments");
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
    revalidatePath("/payments");
    return { success: true };
  } catch {
    return { error: "Já existe um tipo de pagamento com este nome." };
  }
}

export async function deletePaymentType(id: string) {
  try {
    await prisma.paymentType.delete({ where: { id } });
    revalidatePath("/payments");
    return { success: true };
  } catch {
    return { error: "Não é possível eliminar um tipo de pagamento com encomendas associadas." };
  }
}

export async function restorePaymentType(paymentType: PaymentType) {
  try {
    await prisma.paymentType.upsert({
      where: { id: paymentType.id },
      update: {},
      create: { id: paymentType.id, name: paymentType.name },
    });
  } catch { /* name conflict — ignore */ }
  revalidatePath("/payments");
  return { success: true };
}
