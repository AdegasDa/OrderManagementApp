"use server";

import { prisma } from "@/lib/prisma";
import { clientSchema } from "./schema";
import type { Client } from "@/lib/types";

function serialize(c: { id: string; name: string; phone: string; source: string; createdAt: Date; updatedAt: Date }): Client {
  return { ...c, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString() };
}

export async function getClients(): Promise<Client[]> {
  const rows = await prisma.client.findMany({ orderBy: { name: "asc" } });
  return rows.map(serialize);
}

export async function createClient(data: unknown) {
  const parsed = clientSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  try {
    await prisma.client.create({ data: parsed.data });
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
    return { success: true };
  } catch {
    return { error: "Erro ao atualizar cliente." };
  }
}

export async function deleteClient(id: string) {
  await prisma.client.delete({ where: { id } });
  return { success: true };
}

export async function restoreClient(client: Client) {
  await prisma.client.upsert({
    where: { id: client.id },
    update: {},
    create: { id: client.id, name: client.name, phone: client.phone, source: client.source },
  });
  return { success: true };
}
