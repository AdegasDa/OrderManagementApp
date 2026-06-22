import { put, del } from "@vercel/blob";
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
      return NextResponse.json(
        { error: `Máximo ${MAX_FILE_COUNT} ficheiros por envio.` },
        { status: 400 }
      );
    }

    for (const file of files) {
      const mime = file.type.split(";")[0].trim().toLowerCase();
      if (!ALLOWED_TYPES.has(mime)) {
        return NextResponse.json(
          { error: `Tipo de ficheiro não permitido: ${mime}` },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Ficheiro demasiado grande (máximo 10 MB): ${file.name}` },
          { status: 400 }
        );
      }
    }

    const urls = await Promise.all(
      files.map((file) => {
        // Sanitise filename: strip special characters, cap length
        const safeName = file.name
          .replace(/[^a-zA-Z0-9._-]/g, "_")
          .slice(0, 100);
        return put(safeName, file, { access: "public", addRandomSuffix: true }).then((r) => r.url);
      })
    );

    return NextResponse.json({ urls });
  } catch (err) {
    console.error("[upload] error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}

// Called by the client to clean up blobs that were uploaded but whose
// associated order failed to save (F-02: orphaned blob prevention).
export async function DELETE(request: Request) {
  try {
    const { urls } = await request.json() as { urls: string[] };
    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ ok: true });
    }
    await del(urls);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[upload/delete] error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
