import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Müşterinin kendi siparişlerini listeler (sadece role === musteri)
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "musteri") {
    return NextResponse.json({ orders: [] });
  }
  const orders = await prisma.order.findMany({
    where: { customerId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { catalogItem: true } },
      user: { select: { companyName: true, name: true } },
    },
  });
  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      status: o.status,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      total: o.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
      createdAt: o.createdAt,
      firmaName: o.user?.companyName || o.user?.name,
      items: o.items.map((i) => ({
        name: i.catalogItem.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    })),
  });
}
