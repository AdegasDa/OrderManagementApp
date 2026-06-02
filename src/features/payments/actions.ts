"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { paymentTypeSchema } from "./schema";

export async function getPaymentTypes() {
  return prisma.paymentType.findMany({ orderBy: { name: "asc" } });
}

export async function createPaymentType(data: unknown) {
  const parsed = paymentTypeSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  await prisma.paymentType.create({ data: parsed.data });
  revalidatePath("/payments");
  return { success: true };
}

export async function updatePaymentType(id: string, data: unknown) {
  const parsed = paymentTypeSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  await prisma.paymentType.update({ where: { id }, data: parsed.data });
  revalidatePath("/payments");
  return { success: true };
}

export async function deletePaymentType(id: string) {
  await prisma.paymentType.delete({ where: { id } });
  revalidatePath("/payments");
  return { success: true };
}
