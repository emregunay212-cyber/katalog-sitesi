import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();
  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 text-center w-full">
        <h1 className="text-3xl sm:text-4xl font-bold text-stone-800 mb-4">
          Katalogunuzu paylaşın, siparişleri tek yerden yönetin
        </h1>
        <p className="text-stone-600 mb-8 max-w-xl mx-auto">
          Yerel işletmeniz için katalog oluşturun. Müşterileriniz linke tıklayıp
          ürünleri seçerek sipariş verebilir. Siparişler hesabınızda listelenir.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {user ? (
            user.role === "musteri" ? (
              <Link
                href="/hesabim"
                className="inline-flex items-center justify-center bg-amber-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-amber-600"
              >
                Hesabıma Git
              </Link>
            ) : (
              <Link
                href="/panel"
                className="inline-flex items-center justify-center bg-amber-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-amber-600"
              >
                Panele Git
              </Link>
            )
          ) : (
            <>
              <Link
                href="/kayit"
                className="inline-flex items-center justify-center bg-amber-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-amber-600"
              >
                Ücretsiz Başla
              </Link>
              <Link
                href="/giris"
                className="inline-flex items-center justify-center border border-stone-300 px-6 py-3 rounded-xl font-medium hover:bg-stone-100"
              >
                Zaten hesabım var
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
