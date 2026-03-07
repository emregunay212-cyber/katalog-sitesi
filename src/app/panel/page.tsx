import Link from "next/link";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { FirmaLinkCopy } from "./FirmaLinkCopy";

export default async function PanelPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const catalogs = await prisma.catalog.findMany({
    where: { userId: user.id },
    include: { _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Sadece bekleyen ve okunmamış siparişler bildirime dahil (geçmiştekiler sayılmaz)
  const unreadOrdersCount = await prisma.order.count({
    where: { userId: user.id, status: "pending", readByOwner: false },
  });

  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;
  const firmaSlug = "slug" in user ? (user as { slug: string }).slug : null;

  return (
    <div>
      {firmaSlug && (
        <div className="mb-4 bg-white border border-stone-200 rounded-xl p-4">
          <p className="text-sm font-medium text-stone-700">Firma linki (müşteriye bu linki atın — tüm ürünleriniz görünür)</p>
          <FirmaLinkCopy url={`${baseUrl}/firma/${firmaSlug}`} />
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-stone-800">Kataloglarım (Kategoriler)</h1>
        <Link
          href="/panel/katalog/yeni"
          className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600"
        >
          + Yeni Katalog
        </Link>
      </div>

      {unreadOrdersCount > 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <span className="font-medium">Yeni siparişiniz var!</span>
          <span>{unreadOrdersCount} okunmamış sipariş</span>
        </div>
      )}

      {catalogs.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-stone-600">
          Henüz katalog oluşturmadınız. İlk kataloğunuzu oluşturup ürün ekleyin,
          sonra paylaşım linkini müşterilerinizle paylaşın.
          <div className="mt-4">
            <Link
              href="/panel/katalog/yeni"
              className="text-amber-600 hover:underline font-medium"
            >
              Katalog oluştur →
            </Link>
          </div>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {catalogs.map((c) => (
            <li key={c.id}>
              <Link
                href={`/panel/katalog/${c.id}`}
                className="block bg-white border border-stone-200 rounded-xl p-5 hover:border-amber-300 transition"
              >
                <h2 className="font-semibold text-stone-800">{c.name}</h2>
                <p className="text-sm text-stone-500 mt-1">
                  {c._count.items} ürün
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
