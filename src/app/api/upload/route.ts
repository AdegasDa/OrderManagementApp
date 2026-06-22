import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const files = formData.getAll("file") as File[];

  const urls = await Promise.all(
    files.map((file) =>
      put(file.name, file, { access: "public", addRandomSuffix: true })
        .then((r) => r.url)
    )
  );

  return NextResponse.json({ urls });
}
