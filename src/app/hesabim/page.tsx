"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Firma = { id: string; slug: string; name: string };

type OrderRow = {
  id: string;
  status: string;
  customerName: string;
  customerEmail: string;
  total: number;
  createdAt: string;
  firmaName: string;
  items: { name: string; quantity: number; unitPrice: number }[];
};

export default function HesabimPage() {
  const [firmalar, setFirmalar] = useState<Firma[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loadingFirmalar, setLoadingFirmalar] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/firmalar")
      .then((r) => r.json())
      .then((data) => setFirmalar(data.firmalar || []))
      .finally(() => setLoadingFirmalar(false));
  }, []);

  useEffect(() => {
    fetch("/api/me/siparisler")
      .then((r) => r.json())
      .then((data) => setOrders(data.orders || []))
      .finally(() => setLoadingOrders(false));
  }, []);

  async function handleIptal(orderId: string) {
    setCancellingId(orderId);
    try {
      const res = await fetch("/api/siparis-iptal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o))
        );
      } else {
        alert(data.error || "İptal edilemedi.");
      }
    } catch {
      alert("Bağlantı hatası.");
    } finally {
      setCancellingId(null);
    }
  }

  function statusLabel(s: string) {
    if (s === "pending") return "Beklemede";
    if (s === "completed") return "Tamamlandı";
    if (s === "cancelled") return "İptal edildi";
    return s;
  }

  return (
    <div className="space-y-10">
      {/* Mağazalar / Firmalar - alıcı buradan ürün alabileceği firmayı seçer */}
      <section>
        <h1 className="text-xl sm:text-2xl font-bold text-stone-800 mb-2">Mağazalar</h1>
        <p className="text-stone-600 text-sm mb-4">
          Alışveriş yapmak için bir firmaya tıklayın; ürünleri görüp sepete ekleyerek sipariş verebilirsiniz.
        </p>
        {loadingFirmalar ? (
          <p className="text-stone-500 text-sm">Firmalar yükleniyor...</p>
        ) : firmalar.length === 0 ? (
          <p className="text-stone-600 text-sm">Henüz mağaza bulunmuyor.</p>
        ) : (
          <ul className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            {firmalar.map((f) => (
              <li key={f.id}>
                <Link
                  href={`/firma/${f.slug}`}
                  className="block bg-white border border-stone-200 rounded-xl p-4 hover:border-amber-400 hover:shadow-sm transition min-h-[44px] flex items-center"
                >
                  <span className="font-medium text-stone-800">{f.name}</span>
                  <span className="block text-amber-600 text-sm mt-1">Ürünlere git →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Siparişlerim */}
      <section>
        <h2 className="text-xl font-bold text-stone-800 mb-4">Siparişlerim</h2>
        {loadingOrders ? (
          <p className="text-stone-500 text-sm">Siparişleriniz yükleniyor...</p>
        ) : orders.length === 0 ? (
          <p className="text-stone-600 text-sm">Henüz siparişiniz yok.</p>
        ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li
              key={o.id}
              className="bg-white border border-stone-200 rounded-xl p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="font-mono text-sm text-stone-500">{o.id}</span>
                <span
                  className={`text-sm font-medium ${
                    o.status === "pending"
                      ? "text-amber-600"
                      : o.status === "completed"
                        ? "text-green-600"
                        : "text-stone-500"
                  }`}
                >
                  {statusLabel(o.status)}
                </span>
              </div>
              <p className="text-stone-600 text-sm mb-1">
                {o.firmaName} • {new Date(o.createdAt).toLocaleDateString("tr-TR")}
              </p>
              <p className="font-semibold text-stone-800">
                Toplam: {o.total.toFixed(2)} ₺
              </p>
              <ul className="mt-2 text-sm text-stone-600 list-disc list-inside">
                {o.items.map((i, idx) => (
                  <li key={idx}>
                    {i.name} × {i.quantity} — {(i.unitPrice * i.quantity).toFixed(2)} ₺
                  </li>
                ))}
              </ul>
              {o.status === "pending" && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => handleIptal(o.id)}
                    disabled={cancellingId === o.id}
                    className="text-red-600 hover:underline text-sm font-medium disabled:opacity-50"
                  >
                    {cancellingId === o.id ? "İptal ediliyor..." : "Siparişi iptal et"}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
        )}
      </section>

      <p className="pt-4 text-sm text-stone-500">
        <Link href="/" className="text-amber-600 hover:underline">
          ← Ana sayfaya dön
        </Link>
      </p>
    </div>
  );
}
