"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function SiparisIptalForm() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") || "";
  const [orderId, setOrderId] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  useEffect(() => {
    if (ref) setOrderId(ref);
  }, [ref]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/siparis-iptal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderId.trim(), customerEmail: customerEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "ok", text: "Siparişiniz iptal edildi." });
        setOrderId("");
        setCustomerEmail("");
      } else {
        setMessage({ type: "error", text: data.error || "İptal edilemedi." });
      }
    } catch {
      setMessage({ type: "error", text: "Bağlantı hatası." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-3 sm:px-4 py-6">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-bold text-stone-800 mb-2">Siparişi iptal et</h1>
        <p className="text-stone-600 text-sm mb-4">
          Sipariş onay sayfasındaki sipariş numaranızı ve siparişte kullandığınız e-posta adresini girin.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="orderId" className="block text-sm font-medium text-stone-700 mb-1">
              Sipariş numarası
            </label>
            <input
              id="orderId"
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2"
              placeholder="Sipariş numaranızı yapıştırın"
              required
            />
          </div>
          <div>
            <label htmlFor="customerEmail" className="block text-sm font-medium text-stone-700 mb-1">
              E-posta adresi
            </label>
            <input
              id="customerEmail"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2"
              placeholder="Siparişte yazdığınız e-posta"
              required
            />
          </div>
          {message && (
            <div
              className={`px-3 py-2 rounded-lg text-sm ${
                message.type === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-800 text-white py-2 rounded-lg hover:bg-stone-700 disabled:opacity-50"
          >
            {loading ? "İptal ediliyor..." : "Siparişi iptal et"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-stone-500">
          <Link href="/" className="hover:underline">Ana sayfaya dön</Link>
        </p>
      </div>
    </div>
  );
}

export default function SiparisIptalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-50 flex items-center justify-center">Yükleniyor...</div>}>
      <SiparisIptalForm />
    </Suspense>
  );
}
