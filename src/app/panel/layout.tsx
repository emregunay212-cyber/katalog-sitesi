import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/app/actions";
import Link from "next/link";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/giris");
  }
  if (user.role === "musteri") {
    redirect("/");
  }
  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="border-b border-stone-100 bg-stone-50">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2 flex items-center gap-4">
          <Link href="/panel" className="text-sm font-medium text-stone-700 hover:text-stone-900">
            Kataloglar
          </Link>
          <Link href="/panel/firma" className="text-sm text-stone-500 hover:text-stone-900">
            Firmamı düzenle
          </Link>
          <Link href="/panel/siparisler" className="text-sm text-stone-500 hover:text-stone-900">
            Siparişler
          </Link>
          <Link href="/panel/hesap" className="text-sm text-stone-500 hover:text-stone-900">
            Hesap ayarları
          </Link>
          <form action={logout} className="ml-auto">
            <button type="submit" className="text-sm text-red-500 hover:text-red-700">
              Çıkış yap
            </button>
          </form>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">{children}</main>
    </div>
  );
}
