"use client";

import { useState, useEffect } from "react";

export function BilgilerimForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setName(data.user.name || "");
          setPhone(data.user.phone || "");
          setAddress(data.user.address || "");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, address }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Bilgileriniz güncellendi." });
      } else {
        setMessage({ type: "error", text: data.error || "Bir hata oluştu." });
      }
    } catch {
      setMessage({ type: "error", text: "Bağlantı hatası. Tekrar deneyin." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white border border-stone-200 rounded-xl p-4">
        <p className="text-stone-500 text-sm">Bilgiler yükleniyor...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-xl p-4 space-y-4">
      <h2 className="text-lg font-bold text-stone-800">Bilgilerimi Güncelle</h2>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Ad Soyad <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Adınız Soyadınız"
          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Telefon</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="05xx xxx xx xx"
          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Adres</label>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={3}
          placeholder="Teslimat adresiniz"
          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 resize-none"
        />
      </div>

      {message && (
        <p
          className={`text-sm font-medium ${
            message.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message.type === "success" ? "✓ " : "✕ "}
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        {saving ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}
