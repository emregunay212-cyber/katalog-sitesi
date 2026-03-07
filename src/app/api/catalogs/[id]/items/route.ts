import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }
  const { id: catalogId } = await params;
  const catalog = await prisma.catalog.findFirst({
    where: { id: catalogId, userId: user.id },
  });
  if (!catalog) {
    return NextResponse.json({ error: "Katalog bulunamadı." }, { status: 404 });
  }
  const body = await request.json();
  const { name, description, price, imageUrl } = body;
  if (!name?.trim() || price == null) {
    return NextResponse.json(
      { error: "Ürün adı ve fiyat gerekli." },
      { status: 400 }
    );
  }
  const maxOrder = await prisma.catalogItem.aggregate({
    where: { catalogId },
    _max: { orderIndex: true },
  });
  const item = await prisma.catalogItem.create({
    data: {
      catalogId,
      name: name.trim(),
      description: description?.trim() || null,
      price: Number(price),
      imageUrl: imageUrl?.trim() || null,
      orderIndex: (maxOrder._max.orderIndex ?? -1) + 1,
    },
  });
  return NextResponse.json({ item });
}
