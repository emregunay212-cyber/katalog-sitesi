import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { prisma } from "@/lib/db";

// Firmanın tüm siparişleri (kategorili kalem bilgisiyle)
export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const user = auth.user;
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: {
      items: {
        include: {
          catalogItem: { include: { catalog: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  const unreadCount = await prisma.order.count({
    where: { userId: user.id, readByOwner: false },
  });
  return NextResponse.json({ orders, unreadCount });
}
