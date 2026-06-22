import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true });
  } catch {
    // Do not expose error details — log server-side only
    console.error("[health] DB check failed");
    return Response.json({ ok: false }, { status: 503 });
  }
}
