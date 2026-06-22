import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE  = 10 * 1024 * 1024; // 10 MB
const MAX_FILE_COUNT = 20;
const ALLOWED_TYPES  = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("file") as File[];

    if (files.length === 0) return NextResponse.json({ urls: [] });
    if (files.length > MAX_FILE_COUNT) {
      return NextResponse.json({ error: `Máximo ${MAX_FILE_COUNT} ficheiros por envio.` }, { status: 400 });
    }

    for (const file of files) {
      const mime = file.type.split(";")[0].trim().toLowerCase();
      if (!ALLOWED_TYPES.has(mime)) {
        return NextResponse.json({ error: `Tipo de ficheiro não permitido: ${mime}` }, { status: 400 });
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: `Ficheiro demasiado grande (máximo 10 MB): ${file.name}` }, { status: 400 });
      }
    }

    const urls = await Promise.all(
      files.map((file) =>
        put(file.name, file, { access: "private", addRandomSuffix: true }).then((r) => r.url)
      )
    );

    return NextResponse.json({ urls });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[upload] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
