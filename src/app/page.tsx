import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const firms = await prisma.user.findMany({
    where: { role: "firma" },
    select: {
      id: true,
      name: true,
      companyName: true,
      slug: true,
      logoUrl: true,
      _count: { select: { catalogs: true } },
    },
    orderBy: { name: "asc" },
  });

  const firmalar = firms
    .filter((f) => f._count.catalogs > 0)
    .map((f) => ({
      id: f.id,
      slug: f.slug,
      name: f.companyName || f.name,
      logoUrl: f.logoUrl,
    }));

  return (
    <div className="min-h-screen bg-stone-50">
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Arama */}
        <section className="mb-8">
          <form action="/ara" method="get" className="max-w-xl mx-auto">
            <div className="relative">
              <input
                type="search"
                name="q"
                placeholder="Ürün veya firma ara..."
                className="w-full border border-stone-300 rounded-xl px-4 py-3 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-amber-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-amber-600"
              >
                Ara
              </button>
            </div>
          </form>
        </section>

        {/* Firma Listesi */}
        <section>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-800 mb-2">Mağazalar</h1>
          <p className="text-stone-600 text-sm mb-4">
            Bir firmaya tıklayarak ürünlerini görüntüleyin ve sipariş verin.
          </p>
          {firmalar.length === 0 ? (
            <p className="text-stone-500 text-sm">Henüz mağaza bulunmuyor.</p>
          ) : (
            <ul className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              {firmalar.map((f) => (
                <li key={f.id}>
                  <Link
                    href={`/firma/${f.slug}`}
                    className="block bg-white border border-stone-200 rounded-xl p-4 hover:border-amber-400 hover:shadow-sm transition"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {f.logoUrl && (
                        <div className="relative w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-stone-50 border border-stone-200">
                          <Image src={f.logoUrl} alt="" fill className="object-contain p-1" sizes="40px" />
                        </div>
                      )}
                      <span className="font-medium text-stone-800">{f.name}</span>
                    </div>
                    <span className="block text-amber-600 text-sm">Ürünlere git →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
