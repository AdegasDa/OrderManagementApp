import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

// In production (BLOB_READ_WRITE_TOKEN set), upload to Vercel Blob.
// In local dev without a token, fall back to public/uploads/ on disk.

async function uploadToBlob(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `orders/${randomUUID()}.${ext}`;
  const blob = await put(filename, file, { access: "public" });
  return blob.url;
}

async function uploadToLocal(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${randomUUID()}.${ext}`;
  const uploadDir = join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${filename}`;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const files = formData.getAll("files") as File[];

  if (!files.length) {
    return NextResponse.json({ error: "Nenhum ficheiro enviado." }, { status: 400 });
  }

  const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
  const paths: string[] = [];

  for (const file of files) {
    const path = useBlob ? await uploadToBlob(file) : await uploadToLocal(file);
    paths.push(path);
  }

  return NextResponse.json({ paths });
}
