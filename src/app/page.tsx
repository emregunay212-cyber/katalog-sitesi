import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();
  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <header className="border-b border-stone-200 bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center gap-4">
          <Link
            href="/"
            className="text-lg sm:text-xl font-bold text-stone-800 tracking-tight hover:text-stone-600 transition"
          >
            Katalog & Sipariş
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            {user ? (
              <>
                {user.role === "musteri" ? (
                  <Link
                    href="/hesabim"
                    className="px-3 py-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 text-sm font-medium transition"
                  >
                    Hesabım
                  </Link>
                ) : (
                  <Link
                    href="/panel"
                    className="px-3 py-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 text-sm font-medium transition"
                  >
                    Panel
                  </Link>
                )}
                <span className="hidden sm:inline w-px h-4 bg-stone-200" aria-hidden />
                <span className="pl-2 sm:pl-3 text-stone-700 text-sm font-medium truncate max-w-[140px] sm:max-w-[200px]">
                  {user.name}
                </span>
              </>
            ) : (
              <>
                <Link
                  href="/giris"
                  className="px-3 py-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 text-sm font-medium transition"
                >
                  Giriş
                </Link>
                <Link
                  href="/kayit"
                  className="ml-1 bg-stone-800 text-white px-4 py-2 rounded-lg hover:bg-stone-700 text-sm font-medium transition"
                >
                  Kayıt Ol
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 text-center">
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
