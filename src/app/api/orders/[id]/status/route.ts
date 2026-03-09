import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { prisma } from "@/lib/db";

// Sipariş durumunu güncelle (pending, completed, cancelled)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const user = auth.user;
  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id },
  });
  if (!order || order.userId !== user.id) {
    return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  }
  const body = await request.json();
  const status = body.status;
  if (!["pending", "completed", "cancelled"].includes(status)) {
    return NextResponse.json({ error: "Geçersiz durum." }, { status: 400 });
  }
  // Tamamlandı veya iptal edilince otomatik okundu işaretle (okunmamış sayısı düşsün)
  const updated = await prisma.order.update({
    where: { id },
    data: {
      status,
      ...(status === "completed" || status === "cancelled" ? { readByOwner: true } : {}),
    },
  });
  return NextResponse.json({ order: updated });
}
