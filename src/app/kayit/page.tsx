"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type AccountType = "firma" | "musteri";

export default function RegisterPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<AccountType>("firma");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: accountType,
          name,
          companyName: accountType === "firma" ? (companyName || undefined) : undefined,
          email,
          password,
          phone: accountType === "musteri" ? (phone || undefined) : undefined,
          address: accountType === "musteri" ? (address || undefined) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Kayıt başarısız.");
        return;
      }
      if (data.user?.role === "musteri") {
        router.push("/");
      } else {
        router.push("/panel");
      }
      router.refresh();
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-3 sm:px-4 py-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6">Kayıt Ol</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Hesap türü
            </label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="accountType"
                  checked={accountType === "firma"}
                  onChange={() => setAccountType("firma")}
                  className="rounded"
                />
                <span>Firma sahibi (katalog paylaşan)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="accountType"
                  checked={accountType === "musteri"}
                  onChange={() => setAccountType("musteri")}
                  className="rounded"
                />
                <span>Müşteri (satın alan)</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Ad Soyad *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2"
              placeholder={accountType === "firma" ? "Yetkili kişi" : "Adınız soyadınız"}
              required
            />
          </div>
          {accountType === "firma" && (
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Firma adı *
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2"
                placeholder="Müşteriye görünecek işletme adı"
                required={accountType === "firma"}
              />
            </div>
          )}
          {accountType === "musteri" && (
            <>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Telefon (isteğe bağlı)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2"
                  placeholder="Siparişlerde kullanılacak"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Adres (isteğe bağlı)
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2"
                  rows={2}
                  placeholder="Varsayılan teslimat adresi"
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              E-posta *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Şifre *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-800 text-white py-2 rounded-lg hover:bg-stone-700 disabled:opacity-50"
          >
            {loading ? "Kaydediliyor..." : "Kayıt Ol"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-stone-600">
          Zaten hesabınız var mı?{" "}
          <Link href="/giris" className="text-amber-600 hover:underline">
            Giriş yapın
          </Link>
        </p>
        <p className="mt-2 text-center">
          <Link href="/" className="text-stone-500 text-sm hover:underline">
            ← Ana sayfa
          </Link>
        </p>
      </div>
    </div>
  );
}
