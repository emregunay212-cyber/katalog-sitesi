import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export async function Header() {
  const user = await getCurrentUser();
  return (
    <header className="border-b border-stone-200 bg-white shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="text-lg sm:text-xl font-bold text-stone-800 tracking-tight hover:text-stone-600 transition shrink-0"
          >
            Katalog & Sipariş
          </Link>
          <form action="/ara" method="get" className="flex-1 min-w-0 max-w-xs sm:max-w-sm">
            <input
              type="search"
              name="q"
              placeholder="Ürün ara..."
              className="w-full min-h-[36px] sm:min-h-[40px] border border-stone-300 rounded-lg px-3 py-1.5 text-sm"
            />
          </form>
        </div>
        <nav className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Link
            href="/ara"
            className="px-2 py-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 text-sm font-medium"
          >
            Ürün ara
          </Link>
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
  );
}
