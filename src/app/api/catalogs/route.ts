import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slugify";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const user = auth.user;
  const catalogs = await prisma.catalog.findMany({
    where: { userId: user.id },
    include: { _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ catalogs });
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const user = auth.user;
  try {
    const body = await request.json();
    const { name, description, imageUrl } = body;
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Katalog adı gerekli." },
        { status: 400 }
      );
    }
    const baseSlug = slugify(name.trim()) || "katalog";
    let suffix = 0;
    let catalog;
    const MAX_RETRIES = 5;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      let candidateSlug: string;
      if (suffix === 0) {
        candidateSlug = baseSlug;
      } else {
        candidateSlug = `${baseSlug}-${suffix}`;
      }
      // Önce mevcut mu kontrol et
      const existing = await prisma.catalog.findUnique({ where: { slug: candidateSlug } });
      if (existing) {
        suffix++;
        continue;
      }
      try {
        catalog = await prisma.catalog.create({
          data: {
            userId: user.id,
            name: name.trim(),
            description: description?.trim() || null,
            imageUrl: imageUrl?.trim() || null,
            slug: candidateSlug,
          },
        });
        break;
      } catch (err: unknown) {
        // Unique constraint hatası (race condition) — retry
        const prismaError = err as { code?: string };
        if (prismaError.code === "P2002") {
          suffix++;
          continue;
        }
        throw err;
      }
    }
    if (!catalog) {
      return NextResponse.json({ error: "Katalog slug\u0131 olu\u015fturulamad\u0131. Farkl\u0131 bir ad deneyin." }, { status: 409 });
    }
    return NextResponse.json({ catalog });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Katalog oluşturulamadı." }, { status: 500 });
  }
}
