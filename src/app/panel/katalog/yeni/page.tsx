"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewCatalogPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/catalogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Katalog oluşturulamadı.");
        return;
      }
      router.push(`/panel/katalog/${data.catalog.id}`);
      router.refresh();
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Link href="/panel" className="text-stone-500 text-sm hover:underline mb-4 inline-block">
        ← Kataloglar
      </Link>
      <h1 className="text-2xl font-bold text-stone-800 mb-6">Yeni Katalog</h1>
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        {error && (
          <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Katalog adı</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2"
            placeholder="Örn: Kış Koleksiyonu"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Açıklama (isteğe bağlı)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2"
            rows={3}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 disabled:opacity-50"
        >
          {loading ? "Oluşturuluyor..." : "Oluştur"}
        </button>
      </form>
    </div>
  );
}
