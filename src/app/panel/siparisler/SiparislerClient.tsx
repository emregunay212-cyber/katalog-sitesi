"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type OrderItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  catalogItem: {
    id: string;
    name: string;
    catalog: { id: string; name: string };
  };
};

type Order = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany: string | null;
  customerAddress: string | null;
  notes: string | null;
  status: string;
  readByOwner: boolean;
  createdAt: string;
  items: OrderItem[];
};

type Props = {
  pendingOrders: Order[];
  completedOrders: Order[];
};

export function SiparislerClient({ pendingOrders, completedOrders }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(pendingOrders);
  const [completed, setCompleted] = useState(completedOrders);

  async function markRead(orderId: string) {
    const res = await fetch(`/api/orders/${orderId}/read`, { method: "PATCH" });
    if (res.ok) {
      setPending((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, readByOwner: true } : o))
      );
      router.refresh();
    }
  }

  async function updateStatus(orderId: string, status: string) {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setPending((prev) => prev.filter((o) => o.id !== orderId));
      const order = pending.find((o) => o.id === orderId) || completed.find((o) => o.id === orderId);
      if (order) {
        setCompleted((prev) => [{ ...order, status, readByOwner: status === "completed" ? true : order.readByOwner }, ...prev]);
      }
      router.refresh();
    }
  }

  async function deleteOrder(orderId: string) {
    if (!confirm("Bu siparişi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) return;
    const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
    if (res.ok) {
      setCompleted((prev) => prev.filter((o) => o.id !== orderId));
      router.refresh();
    }
  }

  function orderTotal(order: Order): number {
    return order.items.reduce((sum, oi) => sum + oi.quantity * oi.unitPrice, 0);
  }

  function orderStatusLabel(status: string) {
    if (status === "completed") return "Tamamlandı";
    if (status === "cancelled") return "İptal edildi";
    return "Beklemede";
  }

  function OrderCard({
    order,
    showReadButton,
    showDelete,
  }: { order: Order; showReadButton?: boolean; showDelete?: boolean }) {
    return (
      <li
        className={`bg-white border rounded-xl p-4 ${
          !order.readByOwner ? "border-amber-300 bg-amber-50/50" : "border-stone-200"
        } ${order.status === "cancelled" ? "opacity-90" : ""}`}
      >
        <div className="flex justify-between items-start flex-wrap gap-2">
          <div>
            {!order.readByOwner && order.status === "pending" && (
              <span className="inline-block bg-amber-500 text-white text-xs px-2 py-0.5 rounded mr-2">
                Yeni
              </span>
            )}
            {(order.status === "completed" || order.status === "cancelled") && (
              <span
                className={`inline-block text-xs px-2 py-0.5 rounded mr-2 ${
                  order.status === "cancelled"
                    ? "bg-red-100 text-red-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {orderStatusLabel(order.status)}
              </span>
            )}
            <span className="font-medium">{order.customerName}</span>
            <span className="text-stone-500 text-sm ml-2">
              {new Date(order.createdAt).toLocaleString("tr-TR")}
            </span>
          </div>
          <div className="flex gap-2 items-center">
            {showReadButton && !order.readByOwner && (
              <button
                type="button"
                onClick={() => markRead(order.id)}
                className="text-sm text-amber-600 hover:underline"
              >
                Okundu işaretle
              </button>
            )}
            {order.status === "pending" && (
              <select
                value={order.status}
                onChange={(e) => updateStatus(order.id, e.target.value)}
                className="border border-stone-300 rounded px-2 py-1 text-sm"
                aria-label="Sipariş durumu"
              >
                <option value="pending">Beklemede</option>
                <option value="completed">Tamamlandı</option>
                <option value="cancelled">İptal</option>
              </select>
            )}
            {showDelete && (
              <button
                type="button"
                onClick={() => deleteOrder(order.id)}
                className="text-sm text-red-600 hover:underline"
              >
                Sil
              </button>
            )}
          </div>
        </div>
        <p className="text-sm text-stone-600 mt-1">
          {order.customerEmail} · {order.customerPhone}
        </p>
        {order.customerCompany && (
          <p className="text-sm font-medium text-stone-700 mt-1">
            Firma: {order.customerCompany}
          </p>
        )}
        {order.customerAddress && (
          <p className="text-sm text-stone-600">{order.customerAddress}</p>
        )}
        {order.notes && (
          <p className="text-sm text-stone-500 italic mt-1">Not: {order.notes}</p>
        )}
        <ul className="mt-3 space-y-1 text-sm">
          {order.items.map((oi) => (
            <li key={oi.id}>
              <span className="text-stone-500">[{oi.catalogItem.catalog.name}]</span>{" "}
              {oi.catalogItem.name} × {oi.quantity} ={" "}
              {(oi.quantity * oi.unitPrice).toFixed(2)} ₺
            </li>
          ))}
        </ul>
        <p className="mt-2 pt-2 border-t border-stone-100 font-semibold text-stone-800">
          Toplam: {orderTotal(order).toFixed(2)} ₺
        </p>
      </li>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-stone-800 mb-3">Bekleyen siparişler</h2>
        {pending.length === 0 ? (
          <p className="text-stone-500">Bekleyen sipariş yok.</p>
        ) : (
          <ul className="space-y-4">
            {pending.map((order) => (
              <OrderCard key={order.id} order={order} showReadButton />
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="text-lg font-semibold text-stone-800 mb-3">Tamamlanan / Geçmiş siparişler</h2>
        {completed.length === 0 ? (
          <p className="text-stone-500">Henüz tamamlanan sipariş yok.</p>
        ) : (
          <ul className="space-y-4">
            {completed.map((order) => (
              <OrderCard key={order.id} order={order} showDelete />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
