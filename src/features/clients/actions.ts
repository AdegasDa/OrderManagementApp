"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { clientSchema } from "./schema";

export async function getClients() {
  return prisma.client.findMany({ orderBy: { name: "asc" } });
}

export async function createClient(data: unknown) {
  const parsed = clientSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  await prisma.client.create({ data: parsed.data });
  revalidatePath("/clients");
  return { success: true };
}

export async function updateClient(id: string, data: unknown) {
  const parsed = clientSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  await prisma.client.update({ where: { id }, data: parsed.data });
  revalidatePath("/clients");
  return { success: true };
}

export async function deleteClient(id: string) {
  await prisma.client.delete({ where: { id } });
  revalidatePath("/clients");
  return { success: true };
}
