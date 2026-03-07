import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Müşteri siparişi iptal eder (sipariş no + e-posta ile veya giriş yapan müşteri kendi siparişini)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, customerEmail } = body;
    if (!orderId?.trim()) {
      return NextResponse.json(
        { error: "Sipariş numarası gerekli." },
        { status: 400 }
      );
    }
    const currentUser = await getCurrentUser();
    const order = await prisma.order.findUnique({
      where: { id: orderId.trim() },
    });
    if (!order) {
      return NextResponse.json(
        { error: "Sipariş bulunamadı. Sipariş numaranızı kontrol edin." },
        { status: 404 }
      );
    }
    const isOwnerBySession =
      currentUser?.role === "musteri" &&
      (order as { customerId?: string | null }).customerId === currentUser.id;
    if (!isOwnerBySession) {
      if (!customerEmail?.trim()) {
        return NextResponse.json(
          { error: "Sipariş numarası ve e-posta gerekli." },
          { status: 400 }
        );
      }
      if (order.customerEmail.trim().toLowerCase() !== customerEmail.trim().toLowerCase()) {
        return NextResponse.json(
          { error: "E-posta adresi bu siparişle eşleşmiyor." },
          { status: 400 }
        );
      }
    }
    if (order.status !== "pending") {
      return NextResponse.json(
        { error: "Bu sipariş zaten tamamlanmış veya iptal edilmiş." },
        { status: 400 }
      );
    }
    await prisma.order.update({
      where: { id: orderId.trim() },
      data: { status: "cancelled" },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "İptal işlemi başarısız." }, { status: 500 });
  }
}
