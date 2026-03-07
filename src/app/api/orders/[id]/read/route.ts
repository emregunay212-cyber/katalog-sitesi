import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Siparişi "okundu" işaretle
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }
  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id },
  });
  if (!order || order.userId !== user.id) {
    return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  }
  await prisma.order.update({
    where: { id },
    data: { readByOwner: true },
  });
  return NextResponse.json({ ok: true });
}
