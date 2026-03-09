import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createOrder } from "@/lib/order";

// Müşteri sipariş verir (firma slug ile; sipariş firmaya düşer, kalemlerde kategori belli)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const currentUser = await getCurrentUser();
    const user = await prisma.user.findUnique({
      where: { slug },
      include: {
        catalogs: { include: { items: true } },
      },
    });
    if (!user) {
      return NextResponse.json({ error: "Firma bulunamadı." }, { status: 404 });
    }

    const allItems = user.catalogs.flatMap((c) =>
      c.items.map((i) => ({ id: i.id, price: i.price }))
    );

    const body = await request.json();
    const result = await createOrder({
      firmaUserId: user.id,
      availableItems: allItems,
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
