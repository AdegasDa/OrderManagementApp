import { NextResponse } from "next/server";

const ALLOWED_BLOB_HOST = /^[a-z0-9-]+\.(?:public\.)?blob\.vercel-storage\.com$/i;
const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) return new NextResponse("Missing url", { status: 400 });

  // Prevent SSRF: only allow requests to Vercel Blob storage hosts
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new NextResponse("Invalid url", { status: 400 });
  }

  if (!ALLOWED_BLOB_HOST.test(parsed.hostname)) {
    return new NextResponse("URL not allowed", { status: 403 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return new NextResponse("No blob token", { status: 500 });

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return new NextResponse("Not found", { status: res.status });

    const contentType = res.headers.get("content-type") ?? "";

    // Validate content type — never serve SVGs or non-image content
    const mimeBase = contentType.split(";")[0].trim().toLowerCase();
    if (!ALLOWED_CONTENT_TYPES.includes(mimeBase)) {
      return new NextResponse("Content type not allowed", { status: 415 });
    }

    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeBase,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Failed to fetch photo", { status: 500 });
  }
}
