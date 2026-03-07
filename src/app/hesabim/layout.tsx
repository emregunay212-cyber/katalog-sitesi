import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { logout } from "@/app/actions";

export default async function HesabimLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/giris?from=/hesabim");
  }
  if (user.role !== "musteri") {
    redirect("/panel");
  }
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-4">
            <Link href="/hesabim" className="font-semibold text-stone-800">
              Hesabım
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-stone-600">{user.name}</span>
            <form action={logout} className="inline">
              <button type="submit" className="text-sm text-stone-500 hover:text-stone-800">
                Çıkış
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6">{children}</main>
    </div>
  );
}
