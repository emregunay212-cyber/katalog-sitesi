import { prisma } from "./db";
import { SessionUser } from "./auth";

type OrderInput = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany?: string | null;
  customerAddress?: string | null;
  notes?: string | null;
  items: { catalogItemId?: string; id?: string; quantity?: number }[];
};

type ValidItem = {
  catalogItemId: string;
  quantity: number;
  unitPrice: number;
};

/**
 * Ortak sipariş oluşturma fonksiyonu.
 * Firma veya katalog slug'ı üzerinden sipariş verme mantığını tek yerde toplar.
 * DB transaction ile order + user update atomik olarak yapılır.
 */
export async function createOrder(opts: {
  firmaUserId: string;
  availableItems: { id: string; price: number }[];
  body: OrderInput;
  currentUser: SessionUser | null;
}) {
  const { firmaUserId, availableItems, body, currentUser } = opts;
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
    return { error: "Ad soyad, e-posta ve telefon gerekli.", status: 400 };
  }

  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    return { error: "En az bir ürün seçmelisiniz.", status: 400 };
  }

  const itemMap = new Map(availableItems.map((i) => [i.id, i]));
  const validItems: ValidItem[] = [];
  for (const row of orderItems) {
    const id = row.catalogItemId ?? row.id;
    if (!id) continue;
    const qty = Math.max(1, parseInt(String(row.quantity), 10) || 1);
    const item = itemMap.get(id);
    if (item) {
      validItems.push({ catalogItemId: id, quantity: qty, unitPrice: item.price });
    }
  }

  if (validItems.length === 0) {
    return { error: "Geçerli ürün seçin.", status: 400 };
  }

  const isMusteri = currentUser?.role === "musteri" && currentUser.id;

  // Transaction: order oluştur + müşteri bilgilerini güncelle
  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId: firmaUserId,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        customerCompany: customerCompany?.trim() || null,
        customerAddress: customerAddress?.trim() || null,
        notes: notes?.trim() || null,
        status: "pending",
        readByOwner: false,
        ...(isMusteri ? { customerId: currentUser.id } : {}),
        items: {
          create: validItems.map((i) => ({
            catalogItemId: i.catalogItemId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        },
      } as Parameters<typeof tx.order.create>[0]["data"],
      include: {
        items: { include: { catalogItem: true } },
      },
    });

    // Müşteri bilgilerini güncelle (adres, telefon vb.)
    if (isMusteri) {
      await tx.user.update({
        where: { id: currentUser.id },
        data: {
          name: customerName.trim(),
          ...(customerPhone.trim() && { phone: customerPhone.trim() }),
          ...(customerAddress?.trim() && { address: customerAddress.trim() }),
        } as { name: string },
      });
    }

    return created;
  });

  return { order };
}
