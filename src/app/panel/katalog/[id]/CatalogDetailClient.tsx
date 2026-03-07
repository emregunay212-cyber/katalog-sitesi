"use client";

import { useState } from "react";
import Image from "next/image";

type CatalogItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  orderIndex: number;
};

type Props = {
  catalogId: string;
  catalogName: string;
  catalogDescription: string | null;
  catalogImageUrl: string | null;
  initialItems: CatalogItem[];
};

export function CatalogDetailClient({
  catalogId,
  catalogName,
  catalogDescription,
  catalogImageUrl,
  initialItems,
}: Props) {
  const [items, setItems] = useState(initialItems);
  const [catalogImage, setCatalogImage] = useState(catalogImageUrl);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemImageUrl, setNewItemImageUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleFileUpload(file: File, onUrl: (url: string) => void) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (res.ok && data.url) onUrl(data.url);
    } finally {
      setUploading(false);
    }
  }

  async function saveCatalogImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFileUpload(file, async (url) => {
      setCatalogImage(url);
      const res = await fetch(`/api/catalogs/${catalogId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url }),
      });
      if (res.ok) void 0;
    });
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemName.trim() || !newItemPrice.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/catalogs/${catalogId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newItemName.trim(),
          price: parseFloat(newItemPrice),
          description: newItemDesc.trim() || null,
          imageUrl: newItemImageUrl.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.item) {
        setItems((prev) => [...prev, data.item]);
        setNewItemName("");
        setNewItemPrice("");
        setNewItemDesc("");
        setNewItemImageUrl("");
      }
    } finally {
      setAdding(false);
    }
  }

  async function deleteItem(itemId: string) {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
    const res = await fetch(`/api/catalogs/${catalogId}/items/${itemId}`, {
      method: "DELETE",
    });
    if (res.ok) setItems((prev) => prev.filter((i) => i.id !== itemId));
  }

  function startEdit(item: CatalogItem) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditPrice(String(item.price));
    setEditDesc(item.description || "");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit() {
    if (!editingId || !editName.trim() || editPrice === "") return;
    setSaving(true);
    try {
      const res = await fetch(`/api/catalogs/${catalogId}/items/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          price: parseFloat(editPrice),
          description: editDesc.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.item) {
        setItems((prev) => prev.map((i) => (i.id === editingId ? data.item : i)));
        setEditingId(null);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="bg-white border border-stone-200 rounded-xl p-5 mb-6">
        <h1 className="text-xl font-bold text-stone-800">{catalogName}</h1>
        {catalogDescription && <p className="text-stone-600 mt-1">{catalogDescription}</p>}
        <div className="mt-3">
          <p className="text-sm font-medium text-stone-700 mb-2">Kategori resmi</p>
          {catalogImage ? (
            <div className="relative w-40 h-28 rounded-lg overflow-hidden border border-stone-200">
              <Image src={catalogImage} alt="" fill className="object-cover" />
            </div>
          ) : null}
          <label className="mt-2 inline-block">
            <span className="text-sm text-amber-600 hover:underline cursor-pointer">
              {catalogImage ? "Resmi değiştir" : "Resim yükle"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={saveCatalogImage}
            />
          </label>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-stone-800 mb-3">Ürünler</h2>
        <ul className="space-y-2 mb-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-4 bg-white border border-stone-200 rounded-lg px-4 py-3"
            >
              {editingId === item.id ? (
                <>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="border border-stone-300 rounded px-2 py-1"
                      placeholder="Ürün adı"
                    />
                    <input
                      type="text"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="border border-stone-300 rounded px-2 py-1"
                      placeholder="Açıklama"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="border border-stone-300 rounded px-2 py-1 w-24"
                      placeholder="Fiyat"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={saving}
                      className="text-amber-600 text-sm hover:underline disabled:opacity-50"
                    >
                      {saving ? "Kaydediliyor..." : "Kaydet"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="text-stone-500 text-sm hover:underline"
                    >
                      İptal
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {item.imageUrl && (
                    <div className="relative w-14 h-14 rounded overflow-hidden flex-shrink-0">
                      <Image src={item.imageUrl} alt="" fill className="object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{item.name}</span>
                    {item.description && (
                      <span className="text-stone-500 text-sm ml-2">{item.description}</span>
                    )}
                    <span className="text-amber-600 font-medium ml-2">
                      {item.price.toFixed(2)} ₺
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="text-amber-600 text-sm hover:underline"
                    >
                      Düzenle
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteItem(item.id)}
                      className="text-red-600 text-sm hover:underline"
                    >
                      Sil
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
        <form onSubmit={addItem} className="flex flex-wrap gap-2 items-end">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Ürün adı"
            className="border border-stone-300 rounded-lg px-3 py-2 w-40"
          />
          <input
            type="number"
            step="0.01"
            value={newItemPrice}
            onChange={(e) => setNewItemPrice(e.target.value)}
            placeholder="Fiyat"
            className="border border-stone-300 rounded-lg px-3 py-2 w-24"
          />
          <input
            type="text"
            value={newItemDesc}
            onChange={(e) => setNewItemDesc(e.target.value)}
            placeholder="Açıklama (opsiyonel)"
            className="border border-stone-300 rounded-lg px-3 py-2 w-48"
          />
          <div className="flex items-center gap-2">
            <label className="text-sm text-stone-600">
              Resim:
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, setNewItemImageUrl);
                }}
              />
              <span className="ml-1 text-amber-600 hover:underline cursor-pointer">
                {uploading ? "Yükleniyor..." : "Seç"}
              </span>
            </label>
            {newItemImageUrl && (
              <span className="text-xs text-green-600">✓ Yüklendi</span>
            )}
          </div>
          <button
            type="submit"
            disabled={adding}
            className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 disabled:opacity-50"
          >
            {adding ? "Ekleniyor..." : "Ürün Ekle"}
          </button>
        </form>
      </section>
    </>
  );
}
