"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

type User = {
  id: string;
  email: string;
  name: string;
  slug?: string;
  role?: string;
  companyName?: string | null;
  logoUrl?: string | null;
  phone?: string;
  address?: string;
};

export default function PanelFirmaPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        const u = data?.user;
        if (u) {
          setUser(u);
          setCompanyName(u.companyName ?? "");
          setName(u.name ?? "");
          setSlug(u.slug ?? "");
          setPhone(u.phone ?? "");
          setAddress(u.address ?? "");
          setLogoUrl(u.logoUrl ?? null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleLogoUpload(file: File) {
    setLogoUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (res.ok && data.url) {
        setLogoUrl(data.url);
      } else {
        setError(data.error || "Logo yüklenemedi.");
      }
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await fetch("/api/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim() || undefined,
          name: name.trim(),
          slug: slug.trim(),
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          logoUrl: logoUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Kaydedilemedi.");
        return;
      }
      if (data.user) {
        setUser(data.user);
        setSlug(data.user.slug ?? slug);
      }
      setSuccess("Firma bilgileri başarıyla güncellendi.");
      setTimeout(() => setSuccess(""), 4000);
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="text-stone-500 text-sm">Yükleniyor…</div>
    );
  }
  if (!user || user.role !== "firma") {
    return (
      <div>
        <p className="text-stone-600">Bu sayfa sadece firma hesapları içindir.</p>
        <Link href="/panel" className="text-amber-600 hover:underline mt-2 inline-block">← Panele dön</Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/panel" className="text-stone-500 text-sm hover:underline mb-4 inline-block">← Panele dön</Link>
      <h1 className="text-xl font-bold text-stone-800 mb-4">Firma bilgilerini düzenle</h1>
      <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-xl p-5 max-w-lg space-y-4">
        {error && (
          <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}
        {success && (
          <p className="text-green-700 text-sm bg-green-50 px-3 py-2 rounded-lg">{success}</p>
        )}
        {/* Logo */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">Firma logosu</label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl border-2 border-stone-200 overflow-hidden bg-stone-50 flex items-center justify-center flex-shrink-0">
              {logoUrl ? (
                <div className="relative w-full h-full">
                  <Image src={logoUrl} alt="Logo" fill className="object-cover" sizes="80px" />
                </div>
              ) : (
                <span className="text-stone-400 text-xs text-center px-1">Logo yok</span>
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoUpload(file);
                }}
              />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={logoUploading}
                className="block px-3 py-2 text-sm border border-stone-300 rounded-lg hover:border-amber-400 hover:bg-amber-50 disabled:opacity-50 transition"
              >
                {logoUploading ? "Yükleniyor…" : "Logo seç"}
              </button>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl(null)}
                  className="block text-xs text-red-500 hover:text-red-700"
                >
                  Logoyu kaldır
                </button>
              )}
              <p className="text-xs text-stone-400">JPG, PNG veya WebP. Maks 4MB.</p>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="firma-company" className="block text-sm font-medium text-stone-700 mb-1">Firma adı</label>
          <input
            id="firma-company"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2"
            placeholder="Şirket / işletme adı"
          />
        </div>
        <div>
          <label htmlFor="firma-name" className="block text-sm font-medium text-stone-700 mb-1">Yetkili adı (sizin adınız)</label>
          <input
            id="firma-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2"
            placeholder="Ad Soyad"
            required
          />
        </div>
        <div>
          <label htmlFor="firma-slug" className="block text-sm font-medium text-stone-700 mb-1">Firma linki (URL)</label>
          <input
            id="firma-slug"
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 font-mono text-sm"
            placeholder="firma-adi"
          />
          <p className="text-xs text-stone-500 mt-1">Müşteri sayfanız: /firma/{slug || "..."} — Sadece harf, rakam ve tire kullanılır.</p>
        </div>
        <div>
          <label htmlFor="firma-phone" className="block text-sm font-medium text-stone-700 mb-1">Telefon (opsiyonel)</label>
          <input
            id="firma-phone"
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2"
            placeholder="0555 000 00 00"
          />
        </div>
        <div>
          <label htmlFor="firma-address" className="block text-sm font-medium text-stone-700 mb-1">Adres (opsiyonel)</label>
          <textarea
            id="firma-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 min-h-[80px]"
            placeholder="İşletme adresi"
            rows={3}
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 disabled:opacity-50 font-medium"
        >
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </form>
    </div>
  );
}
