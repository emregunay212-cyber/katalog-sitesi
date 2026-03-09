import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { prisma } from "@/lib/db";

// Firma sahibi siparişi siler (geçmiş siparişler)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const user = auth.user;
  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, userId: user.id },
  });
  if (!order) {
    return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  }
  await prisma.order.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
