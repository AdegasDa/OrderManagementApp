import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true, db: "connected" });
  } catch (err) {
    return Response.json({ ok: false, db: "error", error: String(err) }, { status: 503 });
  }
}
