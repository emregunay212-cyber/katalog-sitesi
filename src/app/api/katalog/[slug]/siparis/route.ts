import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createOrder } from "@/lib/order";

// Müşteri sipariş verir (katalog slug ile; giriş gerekmez)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const currentUser = await getCurrentUser();
    const catalog = await prisma.catalog.findUnique({
      where: { slug },
      include: { items: true },
    });
    if (!catalog) {
      return NextResponse.json({ error: "Katalog bulunamadı." }, { status: 404 });
    }

    const availableItems = catalog.items.map((i) => ({ id: i.id, price: i.price }));

    const body = await request.json();
    const result = await createOrder({
      firmaUserId: catalog.userId,
      availableItems,
      body,
      currentUser,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ order: result.order });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Sipariş oluşturulamadı." }, { status: 500 });
  }
}
