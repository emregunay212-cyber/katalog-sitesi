import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { put } from "@vercel/blob";

export const runtime = "nodejs";
export const maxDuration = 30;

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_SIZE_BEFORE_RESIZE = 4 * 1024 * 1024; // 4MB
const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;
const JPEG_QUALITY = 85;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }
  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "Dosya çok büyük veya geçersiz. En fazla 4MB yükleyebilirsiniz." },
        { status: 413 }
      );
    }
    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Dosya gerekli." }, { status: 400 });
    }
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json(
        { error: "Sadece resim (JPEG, PNG, WebP, GIF) yüklenebilir." },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE_BEFORE_RESIZE) {
      return NextResponse.json(
        { error: "Dosya en fazla 4MB olabilir. Lütfen daha küçük bir resim seçin veya sıkıştırın." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const name = `${randomUUID()}.jpg`;

    let outBuffer: Buffer;
    try {
      outBuffer = await sharp(buffer)
        .resize(MAX_WIDTH, MAX_HEIGHT, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: JPEG_QUALITY })
        .toBuffer();
    } catch (sharpError) {
      console.error("[upload] Sharp error:", sharpError);
      return NextResponse.json(
        { error: "Resim işlenemedi. Geçerli bir JPEG, PNG, WebP veya GIF kullanın." },
        { status: 500 }
      );
    }

    const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;
    if (hasBlobToken) {
      try {
        const blob = await put(`uploads/${name}`, outBuffer, {
          access: "public",
          addRandomSuffix: false,
          contentType: "image/jpeg",
        });
        return NextResponse.json({ url: blob.url });
      } catch (blobError) {
        console.error("[upload] Blob error:", blobError);
        return NextResponse.json(
          {
            error:
              "Blob Storage hatası. Vercel Dashboard > Storage > katalog-uploads bağlantısını ve BLOB_READ_WRITE_TOKEN ortam değişkenini kontrol edip projeyi yeniden deploy edin.",
          },
          { status: 500 }
        );
      }
    }

    await mkdir(UPLOAD_DIR, { recursive: true });
    const filePath = path.join(UPLOAD_DIR, name);
    await sharp(outBuffer).toFile(filePath);
    return NextResponse.json({ url: `/uploads/${name}` });
  } catch (e) {
    console.error("[upload] Unexpected error:", e);
    const message = e instanceof Error ? e.message : "";
    const userMessage =
      message && (message.includes("limit") || message.includes("body"))
        ? "Dosya çok büyük. En fazla 4MB yükleyebilirsiniz."
        : "Resim yüklenemedi. Tekrar deneyin.";
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
