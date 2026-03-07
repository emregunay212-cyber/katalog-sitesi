import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Firma sayfası: kullanıcıyı slug ile bul, tüm katalogları (kategorileri) ve ürünleri döndür
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const user = await prisma.user.findUnique({
    where: { slug },
    include: {
      catalogs: {
        include: {
          items: { orderBy: { orderIndex: "asc" } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!user) {
    return NextResponse.json({ error: "Firma bulunamadı." }, { status: 404 });
  }
  return NextResponse.json({
    firma: {
      id: user.id,
      name: user.name,
      slug: user.slug,
      catalogs: user.catalogs.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        imageUrl: c.imageUrl,
        slug: c.slug,
        items: c.items,
      })),
    },
  });
}
