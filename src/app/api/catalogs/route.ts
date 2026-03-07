import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slugify";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }
  const catalogs = await prisma.catalog.findMany({
    where: { userId: user.id },
    include: { _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ catalogs });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { name, description, imageUrl } = body;
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Katalog adı gerekli." },
        { status: 400 }
      );
    }
    const slug = slugify(name.trim());
    let suffix = 0;
    while (await prisma.catalog.findUnique({ where: { slug: suffix ? `${slug}-${suffix}` : slug } })) {
      suffix++;
    }
    const finalSlug = suffix ? `${slug}-${suffix}` : slug;
    const catalog = await prisma.catalog.create({
      data: {
        userId: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
        slug: finalSlug,
      },
    });
    return NextResponse.json({ catalog });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Katalog oluşturulamadı." }, { status: 500 });
  }
}
