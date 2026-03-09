"use client";

import { useState, useEffect, useCallback } from "react";

type Item = {
  id: string;
  name: string;
  price: number;
};

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type PriceChange = { name: string; oldPrice: number; newPrice: number };

/**
 * Sepet yönetimi ve fiyat kontrol hook'u.
 * FirmaMusteri ve KatalogMusteri'de tekrarlayan mantığı tek yerde toplar.
 */
export function useCart(priceApiUrl: string) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartPriceBanner, setCartPriceBanner] = useState(false);
  const [showPriceWarning, setShowPriceWarning] = useState(false);
  const [priceChangeList, setPriceChangeList] = useState<PriceChange[]>([]);

  const total = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  function addToCart(item: Item, qty: number = 1) {
    const existing = cart.find((c) => c.id === item.id);
    if (existing) {
      setCart((prev) =>
        prev.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + qty } : c
        )
      );
    } else {
      setCart((prev) => [...prev, { ...item, quantity: qty }]);
    }
  }

  function updateQuantity(itemId: string, delta: number) {
    setCart((prev) => {
      const next = prev.map((c) =>
        c.id === itemId ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c
      );
      return next.filter((c) => c.quantity > 0);
    });
  }

  function removeFromCart(itemId: string) {
    setCart((prev) => prev.filter((c) => c.id !== itemId));
  }

  function clearCart() {
    setCart([]);
  }

  const fetchPrices = useCallback(async (): Promise<Record<string, number> | null> => {
    if (cart.length === 0) return null;
    const ids = cart.map((c) => c.id).join(",");
    const res = await fetch(`${priceApiUrl}?ids=${encodeURIComponent(ids)}`);
    const data = await res.json();
    if (!res.ok || !data.prices) return null;
    return data.prices;
  }, [cart, priceApiUrl]);

  const checkCartPrices = useCallback(async () => {
    const prices = await fetchPrices();
    if (!prices) return;
    const hasChange = cart.some((c) => {
      const p = prices[c.id];
      return p !== undefined && p !== c.price;
    });
    setCartPriceBanner(!!hasChange);
  }, [cart, fetchPrices]);

  // Periyodik fiyat kontrolü
  useEffect(() => {
    if (cart.length === 0) {
      setCartPriceBanner(false);
      return;
    }
    checkCartPrices();
    const t = setInterval(checkCartPrices, 45000);
    const onFocus = () => checkCartPrices();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, [cart.length, checkCartPrices]);

  // Sipariş ver butonuna tıklandığında fiyat kontrolü yap
  async function checkPricesBeforeOrder(): Promise<boolean> {
    if (cart.length === 0) return false;
    const prices = await fetchPrices();
    if (!prices) return true; // API başarısız olursa devam et

    const changes: PriceChange[] = [];
    let hasChange = false;
    setCart((prev) =>
      prev.map((c) => {
        const newPrice = prices[c.id];
        if (newPrice !== undefined && newPrice !== c.price) {
          hasChange = true;
          changes.push({ name: c.name, oldPrice: c.price, newPrice });
          return { ...c, price: newPrice };
        }
        return c;
      })
    );

    if (hasChange && changes.length > 0) {
      setPriceChangeList(changes);
      setShowPriceWarning(true);
      return false;
    }
    return true;
  }

  function confirmPriceWarning() {
    setShowPriceWarning(false);
  }

  async function applyCartPriceUpdate() {
    const prices = await fetchPrices();
    if (!prices) return;
    setCart((prev) =>
      prev.map((c) => {
        const newPrice = prices[c.id];
        return newPrice !== undefined ? { ...c, price: newPrice } : c;
      })
    );
    setCartPriceBanner(false);
  }

  return {
    cart,
    total,
    cartPriceBanner,
    showPriceWarning,
    priceChangeList,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    checkPricesBeforeOrder,
    confirmPriceWarning,
    applyCartPriceUpdate,
  };
}
