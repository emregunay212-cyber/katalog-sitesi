import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Tek katalog sayfası için güncel ürün fiyatları
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get("ids");
  if (!ids) return NextResponse.json({ prices: {} });
  const idList = ids.split(",").map((s) => s.trim()).filter(Boolean);
  if (idList.length === 0) return NextResponse.json({ prices: {} });
  const catalog = await prisma.catalog.findUnique({
    where: { slug },
    include: { items: true },
  });
  if (!catalog) return NextResponse.json({ error: "Katalog bulunamadı." }, { status: 404 });
  const prices: Record<string, number> = {};
  for (const id of idList) {
    const item = catalog.items.find((i) => i.id === id);
    if (item) prices[id] = item.price;
  }
  return NextResponse.json({ prices });
}
