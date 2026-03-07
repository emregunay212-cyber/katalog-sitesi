import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Müşteri sipariş verir (giriş gerekmez)
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

    const body = await request.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      customerCompany,
      customerAddress,
      notes,
      items: orderItems,
    } = body;

    if (!customerName?.trim() || !customerEmail?.trim() || !customerPhone?.trim()) {
      return NextResponse.json(
        { error: "Ad soyad, e-posta ve telefon gerekli." },
        { status: 400 }
      );
    }

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      return NextResponse.json(
        { error: "En az bir ürün seçmelisiniz." },
        { status: 400 }
      );
    }

    const itemIds = new Set(catalog.items.map((i) => i.id));
    const validItems: { catalogItemId: string; quantity: number; unitPrice: number }[] = [];
    for (const row of orderItems) {
      const id = row.catalogItemId ?? row.id;
      const qty = Math.max(1, parseInt(String(row.quantity), 10) || 1);
      if (!itemIds.has(id)) continue;
      const item = catalog.items.find((i) => i.id === id);
      if (item) validItems.push({ catalogItemId: id, quantity: qty, unitPrice: item.price });
    }

    if (validItems.length === 0) {
      return NextResponse.json(
        { error: "Geçerli ürün seçin." },
        { status: 400 }
      );
    }

    const orderData = {
      userId: catalog.userId,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      customerCompany: customerCompany?.trim() || null,
      customerAddress: customerAddress?.trim() || null,
      notes: notes?.trim() || null,
      status: "pending",
      readByOwner: false,
      ...(currentUser?.role === "musteri" && currentUser.id
        ? { customerId: currentUser.id }
        : {}),
      items: {
        create: validItems.map((i) => ({
          catalogItemId: i.catalogItemId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      },
    };
    const order = await prisma.order.create({
      data: orderData as Parameters<typeof prisma.order.create>[0]["data"],
      include: {
        items: { include: { catalogItem: true } },
      },
    });

    if (currentUser?.role === "musteri" && currentUser.id) {
      await prisma.user.update({
        where: { id: currentUser.id },
        data: {
          name: customerName.trim(),
          ...(customerPhone.trim() && { phone: customerPhone.trim() }),
          ...(customerAddress?.trim() && { address: customerAddress.trim() }),
        } as { name: string },
      });
    }

    return NextResponse.json({ order });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Sipariş oluşturulamadı." }, { status: 500 });
  }
}
