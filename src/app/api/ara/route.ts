import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const catalogId = searchParams.get("catalog");

  // Kategori listesini her zaman döndür
  const catalogs = await prisma.catalog.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [], catalogs });
  }

  const where: Record<string, unknown> = {
    OR: [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ],
  };
  if (catalogId) {
    where.catalogId = catalogId;
  }

  const items = await prisma.catalogItem.findMany({
    where,
    include: {
      catalog: { select: { name: true, slug: true } },
    },
    orderBy: { name: "asc" },
    take: 50,
  });
  const results = items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    imageUrl: item.imageUrl,
    catalog: item.catalog,
  }));
  return NextResponse.json({ results, catalogs });
}
