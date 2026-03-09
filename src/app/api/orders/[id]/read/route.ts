import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { prisma } from "@/lib/db";

// Siparişi "okundu" işaretle
export async function PATCH(
  _request: Request,
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
  await prisma.order.update({
    where: { id },
    data: { readByOwner: true },
  });
  return NextResponse.json({ ok: true });
}
