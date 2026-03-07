import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Firmanın tüm siparişleri (kategorili kalem bilgisiyle)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }
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
