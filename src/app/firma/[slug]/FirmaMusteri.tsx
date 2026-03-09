"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/lib/useCart";

type Item = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
};

type Catalog = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  items: Item[];
};

type Firma = { id: string; name: string; slug: string };

type Props = {
  firma: Firma;
  catalogs: Catalog[];
};

export function FirmaMusteri({ firma, catalogs }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    cart, total, cartPriceBanner, showPriceWarning, priceChangeList,
    addToCart, updateQuantity, removeFromCart, clearCart,
    checkPricesBeforeOrder, confirmPriceWarning, applyCartPriceUpdate,
  } = useCart(`/api/firma/${firma.slug}/fiyatlar`);

  const [showCheckout, setShowCheckout] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderTotalAmount, setOrderTotalAmount] = useState<number>(0);
  const [orderId, setOrderId] = useState<string>("");
  const [error, setError] = useState("");
  const [loggedInUser, setLoggedInUser] = useState<{ role?: string } | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const ITEMS_PER_PAGE = 24;
  const [visibleByCatalog, setVisibleByCatalog] = useState<Record<string, number>>({});
  const [openCatalogId, setOpenCatalogId] = useState<string | null>(null);
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerCompany: "",
    customerAddress: "",
    notes: "",
  });

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => setLoggedInUser(data?.user ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!showCheckout) return;
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user?.role === "musteri" && data.user.email) {
          setForm((f) => ({
            ...f,
            customerName: data.user.name || f.customerName,
            customerEmail: data.user.email || f.customerEmail,
            customerPhone: data.user.phone || f.customerPhone,
            customerAddress: data.user.address || f.customerAddress,
          }));
        }
      })
      .catch(() => {});
  }, [showCheckout]);

  async function onSiparisVerClick() {
    const canProceed = await checkPricesBeforeOrder();
    if (canProceed) setShowCheckout(true);
  }

  function onConfirmPriceWarning() {
    confirmPriceWarning();
    setShowCheckout(true);
  }

  async function submitOrder(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const res = await fetch(`/api/firma/${firma.slug}/siparis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName.trim(),
          customerEmail: form.customerEmail.trim(),
          customerPhone: form.customerPhone.trim(),
          customerCompany: form.customerCompany.trim() || null,
          customerAddress: form.customerAddress.trim() || null,
          notes: form.notes.trim() || null,
          items: cart.map((c) => ({ catalogItemId: c.id, quantity: c.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Sipariş gönderilemedi.");
        return;
      }
      setOrderTotalAmount(total);
      if (data.order?.id) setOrderId(data.order.id);
      setSuccess(true);
      clearCart();
      setShowCheckout(false);
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setSending(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-stone-800 mb-2">Siparişiniz alındı</h1>
        <p className="text-stone-600 mb-2">
          {firma.name} en kısa sürede sizinle iletişime geçecektir.
        </p>
        <p className="text-lg font-semibold text-stone-800 mb-2">
          Sipariş toplamı: {orderTotalAmount.toFixed(2)} ₺
        </p>
        {orderId && (
          <div className="mt-4 p-3 bg-stone-100 rounded-lg text-left text-sm">
            <p className="font-medium text-stone-700 mb-1">Sipariş numaranız (iptal için saklayın):</p>
            <p className="font-mono text-stone-600 break-all mb-2">{orderId}</p>
            <Link
              href={`/siparis-iptal?ref=${encodeURIComponent(orderId)}`}
              className="text-amber-600 hover:underline"
            >
              Siparişi iptal etmek için tıklayın
            </Link>
          </div>
        )}
        <div className="mt-6">
          <Link
            href="/"
            className="inline-block bg-stone-200 text-stone-800 px-5 py-2.5 rounded-lg font-medium hover:bg-stone-300"
          >
            Ana sayfa
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 min-h-screen flex flex-col">
      <header className="mb-4 sm:mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl sm:text-3xl font-bold text-stone-800">{firma.name}</h1>
        <div className="flex items-center gap-2">
          {loggedInUser?.role === "musteri" && (
            <Link href="/hesabim" className="text-stone-600 hover:text-stone-800 text-sm font-medium">
              Hesabım
            </Link>
          )}
          {loggedInUser ? (
            <button
              type="button"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                setLoggedInUser(null);
                router.refresh();
              }}
              className="bg-stone-200 text-stone-800 text-sm px-4 py-2 rounded-lg hover:bg-stone-300 font-medium"
            >
              Çıkış
            </button>
          ) : (
            <Link
              href={pathname ? `/giris?from=${encodeURIComponent(pathname)}` : "/giris"}
              className="bg-stone-200 text-stone-800 text-sm px-4 py-2 rounded-lg hover:bg-stone-300 font-medium"
            >
              Giriş yap
            </Link>
          )}
        </div>
      </header>

      <div className="grid gap-4 sm:gap-8 lg:grid-cols-3 flex-1">
        <div className="lg:col-span-2 space-y-2">
          {catalogs.map((cat) => {
            const isOpen = openCatalogId === cat.id;
            const limit = visibleByCatalog[cat.id] ?? ITEMS_PER_PAGE;
            const visibleItems = cat.items.slice(0, limit);
            const hasMore = limit < cat.items.length;
            return (
              <section
                key={cat.id}
                className="bg-white border border-stone-200 rounded-xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenCatalogId((id) => (id === cat.id ? null : cat.id))}
                  className="w-full flex items-center gap-3 p-3 sm:p-4 text-left hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-inset"
                  aria-expanded={isOpen}
                >
                  {cat.imageUrl && (
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100">
                      <Image
                        src={cat.imageUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base sm:text-lg font-semibold text-stone-800">{cat.name}</h2>
                    {cat.description && (
                      <p className="text-stone-500 text-sm mt-0.5 line-clamp-1">{cat.description}</p>
                    )}
                    <p className="text-stone-400 text-xs mt-1">{cat.items.length} ürün</p>
                  </div>
                  <span
                    className={`flex-shrink-0 w-8 h-8 flex items-center justify-center text-stone-400 text-sm transition-transform ${isOpen ? "" : "-rotate-90"}`}
                    aria-hidden
                  >
                    ▼
                  </span>
                </button>
                {isOpen && (
                  <div className="border-t border-stone-100">
                    <ul className="p-3 sm:p-4 grid gap-3 grid-cols-1 sm:grid-cols-2">
                      {visibleItems.map((item) => (
                        <li
                          key={item.id}
                          className="border border-stone-100 rounded-lg p-3 flex flex-col"
                        >
                          {item.imageUrl && (
                            <button
                              type="button"
                              onClick={() => setLightboxImage(item.imageUrl)}
                              className="w-full text-left rounded-lg overflow-hidden mb-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                            >
                              <div className="relative w-full aspect-square">
                                <Image
                                  src={item.imageUrl}
                                  alt={item.name}
                                  fill
                                  className="object-cover rounded cursor-zoom-in"
                                  sizes="(max-width: 640px) 100vw, 240px"
                                />
                              </div>
                            </button>
                          )}
                          <h3 className="font-medium text-stone-800 text-sm sm:text-base">{item.name}</h3>
                          {item.description && (
                            <p className="text-sm text-stone-500 mt-0.5 line-clamp-2">{item.description}</p>
                          )}
                          <p className="text-amber-600 font-semibold mt-2">{item.price.toFixed(2)} ₺</p>
                          <div className="mt-auto pt-2 flex items-center gap-2 flex-wrap">
                            <input
                              type="number"
                              min={1}
                              defaultValue={1}
                              id={`qty-${item.id}`}
                              className="w-14 min-h-[44px] border border-stone-300 rounded-lg px-2 py-2 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById(`qty-${item.id}`) as HTMLInputElement;
                                addToCart(item, parseInt(el?.value || "1", 10) || 1);
                              }}
                              className="bg-amber-500 text-white text-sm px-4 py-2.5 min-h-[44px] rounded-lg hover:bg-amber-600 active:bg-amber-700"
                            >
                              Sepete Ekle
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                    {hasMore && (
                      <div className="px-3 sm:px-4 pb-4 flex justify-center">
                        <button
                          type="button"
                          onClick={() =>
                            setVisibleByCatalog((prev) => ({
                              ...prev,
                              [cat.id]: (prev[cat.id] ?? ITEMS_PER_PAGE) + ITEMS_PER_PAGE,
                            }))
                          }
                          className="bg-stone-100 text-stone-700 px-5 py-2.5 rounded-lg hover:bg-stone-200 font-medium text-sm"
                        >
                          Daha fazla göster ({cat.items.length - limit} ürün kaldı)
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <div className="lg:order-none order-first">
          <div className="bg-white border border-stone-200 rounded-xl p-3 sm:p-4 sticky top-3 sm:top-4">
            <h2 className="text-lg font-semibold text-stone-800 mb-3">Sepet</h2>
            {cartPriceBanner && cart.length > 0 && (
              <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                <p className="font-medium text-amber-800 mb-1">Fiyat güncellendi</p>
                <p className="text-amber-700 mb-2">Sepetinizdeki bazı ürünlerin fiyatları değişti. Sipariş Ver&apos;e tıklayınca güncel fiyatlar uygulanacak veya aşağıdaki butonla şimdi güncelleyebilirsiniz.</p>
                <button
                  type="button"
                  onClick={applyCartPriceUpdate}
                  className="text-amber-700 font-medium underline hover:no-underline"
                >
                  Fiyatları güncelle
                </button>
              </div>
            )}
            {cart.length === 0 ? (
              <p className="text-stone-500 text-sm">Sepetiniz boş.</p>
            ) : (
              <>
                <ul className="space-y-2 mb-3">
                  {cart.map((c) => (
                    <li key={c.id} className="flex justify-between items-center text-sm">
                      <span>{c.name} × {c.quantity}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(c.id, -1)}
                          className="w-9 h-9 min-w-[36px] min-h-[36px] rounded border border-stone-300 hover:bg-stone-100 active:bg-stone-200"
                          aria-label="Azalt"
                        >−</button>
                        <button
                          type="button"
                          onClick={() => updateQuantity(c.id, 1)}
                          className="w-9 h-9 min-w-[36px] min-h-[36px] rounded border border-stone-300 hover:bg-stone-100 active:bg-stone-200"
                          aria-label="Artır"
                        >+</button>
                        <span className="w-16 text-right">{(c.price * c.quantity).toFixed(2)} ₺</span>
                        <button type="button" onClick={() => removeFromCart(c.id)} className="text-red-600 hover:underline">Sil</button>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="font-semibold text-stone-800 border-t pt-2">Toplam: {total.toFixed(2)} ₺</p>
                <button
                  type="button"
                  onClick={onSiparisVerClick}
                  className="w-full mt-3 bg-amber-500 text-white py-2.5 rounded-lg hover:bg-amber-600 font-medium"
                >
                  Sipariş Ver
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showPriceWarning && priceChangeList.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-20">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-stone-800 mb-2">Fiyat güncellemesi</h2>
            <p className="text-stone-600 text-sm mb-4">
              Sepetinizdeki bazı ürünlerin fiyatları güncellendi. Yeni fiyatlar aşağıdadır. Kabul ediyorsanız siparişe devam edebilirsiniz.
            </p>
            <ul className="space-y-2 mb-4 text-sm">
              {priceChangeList.map((ch, i) => (
                <li key={i}>
                  <span className="font-medium">{ch.name}</span>:{" "}
                  <span className="line-through text-stone-400">{ch.oldPrice.toFixed(2)} ₺</span>
                  {" → "}
                  <span className="text-amber-600 font-medium">{ch.newPrice.toFixed(2)} ₺</span>
                </li>
              ))}
            </ul>
            <p className="font-semibold text-stone-800 mb-4">
              Yeni toplam: {cart.reduce((s, c) => s + c.price * c.quantity, 0).toFixed(2)} ₺
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={confirmPriceWarning}
                className="flex-1 border border-stone-300 py-2 rounded-lg hover:bg-stone-50"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={onConfirmPriceWarning}
                className="flex-1 bg-amber-500 text-white py-2 rounded-lg hover:bg-amber-600"
              >
                Kabul ediyorum, devam et
              </button>
            </div>
          </div>
        </div>
      )}

      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-30"
          onClick={() => setLightboxImage(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Escape" && setLightboxImage(null)}
          aria-label="Kapat"
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center text-xl hover:bg-white/30"
            aria-label="Kapat"
          >
            ×
          </button>
          <div className="max-w-[95vw] max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImage}
              alt="Büyütülmüş"
              className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded"
            />
          </div>
        </div>
      )}

      {showCheckout && cart.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-10 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-stone-800 mb-4">Sipariş Bilgileri</h2>
            <p className="text-sm text-stone-500 mb-2">Üye iseniz bilgileriniz önceden dolduruldu; isterseniz değiştirebilirsiniz.</p>
            {error && (
              <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm mb-4">{error}</div>
            )}
            <form onSubmit={submitOrder} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Ad Soyad *</label>
                <input type="text" value={form.customerName} onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))} className="w-full border border-stone-300 rounded-lg px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">E-posta *</label>
                <input type="email" value={form.customerEmail} onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))} className="w-full border border-stone-300 rounded-lg px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Telefon *</label>
                <input type="tel" value={form.customerPhone} onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))} className="w-full border border-stone-300 rounded-lg px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Firma adı (isteğe bağlı)</label>
                <input type="text" value={form.customerCompany} onChange={(e) => setForm((f) => ({ ...f, customerCompany: e.target.value }))} className="w-full border border-stone-300 rounded-lg px-3 py-2" placeholder="Siparişin gideceği firma / işletme adı" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Adres (isteğe bağlı)</label>
                <textarea value={form.customerAddress} onChange={(e) => setForm((f) => ({ ...f, customerAddress: e.target.value }))} className="w-full border border-stone-300 rounded-lg px-3 py-2" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Not (isteğe bağlı)</label>
                <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="w-full border border-stone-300 rounded-lg px-3 py-2" rows={2} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCheckout(false)} className="flex-1 border border-stone-300 py-2 rounded-lg hover:bg-stone-50">İptal</button>
                <button type="submit" disabled={sending} className="flex-1 bg-amber-500 text-white py-2 rounded-lg hover:bg-amber-600 disabled:opacity-50">
                  {sending ? "Gönderiliyor..." : "Siparişi Gönder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-20 bg-stone-700 text-white rounded-full p-3 shadow-lg hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
          aria-label="Yukarı çık"
        >
          ↑
        </button>
      )}
    </div>
  );
}
