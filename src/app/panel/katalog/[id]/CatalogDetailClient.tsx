"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

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
  initialIsHidden: boolean;
};

export function CatalogDetailClient({
  catalogId,
  catalogName,
  catalogDescription,
  catalogImageUrl,
  initialItems,
  initialIsHidden,
}: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [catalogImage, setCatalogImage] = useState(catalogImageUrl);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemImageUrl, setNewItemImageUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [editingCatalog, setEditingCatalog] = useState(false);
  const [catName, setCatName] = useState(catalogName);
  const [catDesc, setCatDesc] = useState(catalogDescription || "");
  const [catSaving, setCatSaving] = useState(false);
  const [catSuccess, setCatSuccess] = useState("");
  const [catError, setCatError] = useState("");
  const [importResult, setImportResult] = useState<{
    added: number;
    totalRows: number;
    errors: string[];
    message: string;
  } | null>(null);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const MAX_FILE_MB = 4;
  const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const [editImageUploading, setEditImageUploading] = useState(false);
  const editImageInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [isHidden, setIsHidden] = useState(initialIsHidden);
  const [hiddenSaving, setHiddenSaving] = useState(false);

  async function handleFileUpload(file: File, onUrl: (url: string) => void) {
    setUploadError(null);
    if (!file || file.size === 0) {
      setUploadError("Dosya seçilmedi veya boş.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setUploadError(`Dosya çok büyük. En fazla ${MAX_FILE_MB}MB yükleyebilirsiniz. (Seçilen: ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      return;
    }
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"];
    const type = (file.type || "").toLowerCase();
    if (type && !allowed.includes(type) && !type.startsWith("image/")) {
      setUploadError("Sadece JPEG, PNG, WebP veya GIF yükleyebilirsiniz.");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      let data: { url?: string; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        setUploadError(res.status === 413 ? "Dosya çok büyük. En fazla 4MB." : "Sunucu yanıtı okunamadı. Tekrar deneyin.");
        return;
      }
      if (res.ok && data.url) {
        await onUrl(data.url);
      } else {
        setUploadError(data.error || "Yükleme başarısız. Dosya boyutunu küçültüp tekrar deneyin.");
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setUploading(false);
    }
  }

  async function toggleHidden() {
    setHiddenSaving(true);
    const newVal = !isHidden;
    setIsHidden(newVal);
    try {
      await fetch(`/api/catalogs/${catalogId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isHidden: newVal }),
      });
    } catch {
      setIsHidden(!newVal); // geri al
    } finally {
      setHiddenSaving(false);
    }
  }

  async function saveCatalogImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    await handleFileUpload(file, async (url) => {
      setCatalogImage(url);
      setUploadError(null);
      const res = await fetch(`/api/catalogs/${catalogId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setUploadError(data.error || "Resim kaydedilemedi. Tekrar deneyin.");
      }
    });
  }

  async function saveCatalogInfo() {
    if (!catName.trim()) { setCatError("Kategori adı boş olamaz."); return; }
    setCatSaving(true); setCatError(""); setCatSuccess("");
    try {
      const res = await fetch(`/api/catalogs/${catalogId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catName.trim(), description: catDesc.trim() || null }),
      });
      const data = await res.json();
      if (res.ok) {
        setCatSuccess("Kategori bilgileri güncellendi.");
        setTimeout(() => setCatSuccess(""), 4000);
        setEditingCatalog(false);
        router.refresh();
      } else {
        setCatError(data.error || "Kaydedilemedi.");
      }
    } catch { setCatError("Bağlantı hatası."); }
    finally { setCatSaving(false); }
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
    setEditImageUrl(item.imageUrl);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function moveItem(itemId: string, direction: "up" | "down") {
    const idx = items.findIndex((i) => i.id === itemId);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === items.length - 1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const itemA = items[idx];
    const itemB = items[swapIdx];
    const newOrderA = itemB.orderIndex;
    const newOrderB = itemA.orderIndex;
    setMovingId(itemId);
    setItems((prev) => {
      const updated = prev.map((i) => {
        if (i.id === itemA.id) return { ...i, orderIndex: newOrderA };
        if (i.id === itemB.id) return { ...i, orderIndex: newOrderB };
        return i;
      });
      return [...updated].sort((a, b) => a.orderIndex - b.orderIndex);
    });
    await Promise.all([
      fetch(`/api/catalogs/${catalogId}/items/${itemA.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderIndex: newOrderA }) }),
      fetch(`/api/catalogs/${catalogId}/items/${itemB.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderIndex: newOrderB }) }),
    ]);
    setMovingId(null);
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
          imageUrl: editImageUrl,
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

  async function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImportResult(null);
    setImporting(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/catalogs/${catalogId}/items/import`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      setImportResult({
        added: data.added ?? 0,
        totalRows: data.totalRows ?? 0,
        errors: Array.isArray(data.errors) ? data.errors : [],
        message: data.message || (res.ok ? "İşlem tamamlandı." : data.error || "Hata oluştu."),
      });
      if (res.ok && data.added > 0) {
        router.refresh();
      }
    } catch {
      setImportResult({
        added: 0,
        totalRows: 0,
        errors: [],
        message: "Bağlantı hatası. Tekrar deneyin.",
      });
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      {uploadError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm" role="alert">
          <strong>Resim hatası:</strong> {uploadError}
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="ml-2 text-red-600 underline hover:no-underline"
          >
            Kapat
          </button>
        </div>
      )}
      <div className="bg-white border border-stone-200 rounded-xl p-5 mb-6">
        {isHidden && (
        <div className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Bu katalog müşteri sayfasında gizlidir. Göster butonuna basarak aktif edebilirsiniz.
        </div>
      )}
      {editingCatalog ? (
          <div className="space-y-3 mb-3">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Kategori adı</label>
              <input type="text" value={catName} onChange={(e) => setCatName(e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2" placeholder="Kategori adı" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Açıklama (opsiyonel)</label>
              <textarea value={catDesc} onChange={(e) => setCatDesc(e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 min-h-[60px]" rows={2} placeholder="Kategori açıklaması" />
            </div>
            {catError && <p className="text-red-600 text-sm">{catError}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={saveCatalogInfo} disabled={catSaving}
                className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 disabled:opacity-50 text-sm font-medium">
                {catSaving ? "Kaydediliyor..." : "Kaydet"}
              </button>
              <button type="button" onClick={() => { setEditingCatalog(false); setCatName(catalogName); setCatDesc(catalogDescription || ""); setCatError(""); }}
                className="text-stone-500 px-4 py-2 rounded-lg hover:bg-stone-100 text-sm">İptal</button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h1 className="text-xl font-bold text-stone-800">{catName}</h1>
              {catDesc && <p className="text-stone-600 mt-1">{catDesc}</p>}
              {catSuccess && <p className="text-green-700 text-sm bg-green-50 px-3 py-2 rounded-lg mt-2">{catSuccess}</p>}
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setEditingCatalog(true)}
                className="text-amber-600 text-sm hover:underline shrink-0">Düzenle</button>
              <button
                type="button"
                onClick={toggleHidden}
                disabled={hiddenSaving}
                className={"text-sm hover:underline shrink-0 disabled:opacity-50 " + (isHidden ? "text-stone-400" : "text-stone-500")}
              >
                {isHidden ? "👁 Göster" : "🙈 Gizle"}
              </button>
            </div>
          </div>
        )}
        <div className="mt-3">
          <p className="text-sm font-medium text-stone-700 mb-2">Kategori resmi</p>
          {catalogImage ? (
            <div className="relative w-40 h-28 rounded-lg overflow-hidden border border-stone-200">
              <Image src={catalogImage} alt="" fill className="object-cover" />
            </div>
          ) : null}
          <label className="mt-2 inline-flex items-center gap-2">
            <span className="text-sm text-amber-600 hover:underline cursor-pointer">
              {uploading ? "Yükleniyor..." : catalogImage ? "Resmi değiştir" : "Resim yükle"}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/*"
              className="hidden"
              disabled={uploading}
              onChange={saveCatalogImage}
            />
          </label>
          <p className="text-xs text-stone-500 mt-1">En fazla {MAX_FILE_MB}MB, JPEG/PNG/WebP/GIF</p>
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
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      {editImageUrl ? (
                        <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                          <Image src={editImageUrl} alt="" fill className="object-cover" />
                        </div>
                      ) : null}
                      <input
                        ref={editImageInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,image/*"
                        className="hidden"
                        disabled={editImageUploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (!file) return;
                          setEditImageUploading(true);
                          await handleFileUpload(file, (url) => { setEditImageUrl(url); });
                          setEditImageUploading(false);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => editImageInputRef.current?.click()}
                        disabled={editImageUploading}
                        className="text-xs text-amber-600 hover:underline disabled:opacity-50"
                      >
                        {editImageUploading ? "Yükleniyor..." : editImageUrl ? "Resmi değiştir" : "Resim ekle"}
                      </button>
                      {editImageUrl && (
                        <button
                          type="button"
                          onClick={() => setEditImageUrl(null)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Kaldır
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={saving || editImageUploading}
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
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveItem(item.id, "up")}
                      disabled={movingId !== null || items.indexOf(item) === 0}
                      className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-stone-700 disabled:opacity-30 rounded hover:bg-stone-100"
                      title="Yukarı taşı"
                    >↑</button>
                    <button
                      type="button"
                      onClick={() => moveItem(item.id, "down")}
                      disabled={movingId !== null || items.indexOf(item) === items.length - 1}
                      className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-stone-700 disabled:opacity-30 rounded hover:bg-stone-100"
                      title="Aşağı taşı"
                    >↓</button>
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="text-amber-600 text-sm hover:underline ml-1"
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
                accept="image/jpeg,image/png,image/webp,image/gif,image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, (url) => { setNewItemImageUrl(url); setUploadError(null); });
                  e.target.value = "";
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

        <div className="mt-6 p-4 bg-stone-50 border border-stone-200 rounded-xl">
          <h3 className="text-sm font-semibold text-stone-700 mb-2">CSV ile toplu ürün ekle</h3>
          <p className="text-xs text-stone-500 mb-3">
            Excel şablonunu indirip doldurun, kaydedin; sonra aşağıdan yükleyin. CSV veya Excel kabul edilir. Resimleri sonradan düzenleyerek ekleyebilirsiniz.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`/api/catalogs/${catalogId}/items/template/excel`}
              download="urun-sablonu.xlsx"
              className="text-sm text-amber-600 hover:underline font-medium"
            >
              Excel şablonu indir (.xlsx)
            </a>
            <span className="text-stone-400">|</span>
            <a
              href={`/api/catalogs/${catalogId}/items/template`}
              download="urun-sablonu.csv"
              className="text-sm text-stone-500 hover:underline"
            >
              CSV şablonu
            </a>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-stone-600">Dosya seç (Excel veya CSV):</span>
              <input
                type="file"
                accept=".csv,.xlsx"
                className="hidden"
                disabled={importing}
                onChange={handleCsvImport}
              />
              <span className="bg-white border border-stone-300 rounded-lg px-3 py-2 text-amber-600 hover:bg-amber-50 cursor-pointer">
                {importing ? "Yükleniyor..." : "Dosya seç"}
              </span>
            </label>
          </div>
          {importResult && (
            <div
              className={`mt-3 p-3 rounded-lg text-sm ${importResult.added > 0 ? "bg-green-50 text-green-800 border border-green-200" : "bg-amber-50 text-amber-800 border border-amber-200"}`}
              role="alert"
            >
              <p className="font-medium">{importResult.message}</p>
              {importResult.added > 0 && (
                <p className="mt-1">{importResult.added} ürün eklendi.</p>
              )}
              {importResult.errors.length > 0 && (
                <ul className="mt-2 list-disc list-inside text-xs">
                  {importResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
