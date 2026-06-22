"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { clientSchema } from "./schema";
import type { Client } from "@/lib/types";

function serialize(c: { id: string; name: string; phone: string; source: string; socialHandle: string | null; createdAt: Date; updatedAt: Date }): Client {
  return { ...c, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString() };
}

const PAGE_SIZE = 50;

export async function getClients(page = 0): Promise<{ items: Client[]; total: number }> {
  const [rows, total] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" }, take: PAGE_SIZE, skip: page * PAGE_SIZE }),
    prisma.client.count(),
  ]);
  return { items: rows.map(serialize), total };
}

/** Returns all clients (id + name only) for form dropdowns — no pagination. */
export async function getAllClients(): Promise<Pick<Client, "id" | "name" | "phone" | "source" | "socialHandle">[]> {
  return prisma.client.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, phone: true, source: true, socialHandle: true },
  });
}

export async function createClient(data: unknown) {
  const parsed = clientSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  try {
    await prisma.client.create({ data: parsed.data });
    revalidatePath("/clients");
    return { success: true };
  } catch {
    return { error: "Erro ao guardar cliente." };
  }
}

export async function updateClient(id: string, data: unknown) {
  const parsed = clientSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  try {
    await prisma.client.update({ where: { id }, data: parsed.data });
    revalidatePath("/clients");
    return { success: true };
  } catch {
    return { error: "Erro ao atualizar cliente." };
  }
}

export async function deleteClient(id: string) {
  try {
    await prisma.client.delete({ where: { id } });
    revalidatePath("/clients");
    return { success: true };
  } catch {
    return { error: "Não é possível eliminar um cliente com encomendas associadas." };
  }
}

export async function restoreClient(client: Client) {
  await prisma.client.upsert({
    where: { id: client.id },
    update: {},
    create: { id: client.id, name: client.name, phone: client.phone, source: client.source, socialHandle: client.socialHandle },
  });
  revalidatePath("/clients");
  return { success: true };
}
