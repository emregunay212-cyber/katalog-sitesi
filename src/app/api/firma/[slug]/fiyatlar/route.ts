import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Müşteri sepetindeki ürünlerin güncel fiyatlarını döndürür (sayfa yenilenmeden fiyat kontrolü için)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get("ids"); // virgülle ayrılmış id listesi
  if (!ids) {
    return NextResponse.json({ prices: {} });
  }
  const idList = ids.split(",").map((s) => s.trim()).filter(Boolean);
  if (idList.length === 0) {
    return NextResponse.json({ prices: {} });
  }
  const user = await prisma.user.findUnique({
    where: { slug },
    include: { catalogs: { include: { items: true } } },
  });
  if (!user) {
    return NextResponse.json({ error: "Firma bulunamadı." }, { status: 404 });
  }
  const allItems = user.catalogs.flatMap((c) => c.items);
  const prices: Record<string, number> = {};
  for (const id of idList) {
    const item = allItems.find((i) => i.id === id);
    if (item) prices[id] = item.price;
  }
  return NextResponse.json({ prices });
}
