"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

type SearchResult = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  catalog: { name: string; slug: string };
};

type CatalogOption = { id: string; name: string };

export default function AraPage() {
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(qParam);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [catalogs, setCatalogs] = useState<CatalogOption[]>([]);
  const [selectedCatalog, setSelectedCatalog] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (term: string, catalogId: string) => {
    const t = term.trim();
    if (t.length < 2) {
      setResults([]);
      setSearched(true);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      let url = `/api/ara?q=${encodeURIComponent(t)}`;
      if (catalogId) url += `&catalog=${encodeURIComponent(catalogId)}`;
      const res = await fetch(url);
      const data = await res.json();
      setResults(data.results ?? []);
      if (data.catalogs) setCatalogs(data.catalogs);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Kategori listesini ilk yüklemede çek
  useEffect(() => {
    fetch("/api/ara?q=")
      .then((r) => r.json())
      .then((data) => { if (data.catalogs) setCatalogs(data.catalogs); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setQuery(qParam);
    if (qParam.trim().length >= 2) {
      doSearch(qParam, selectedCatalog);
    } else {
      setResults([]);
      setSearched(false);
    }
  }, [qParam, doSearch, selectedCatalog]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const term = query.trim();
    if (term.length < 2) return;
    const url = new URL("/ara", window.location.origin);
    url.searchParams.set("q", term);
    window.history.pushState({}, "", url.toString());
    doSearch(term, selectedCatalog);
  }

  function handleCatalogChange(catalogId: string) {
    setSelectedCatalog(catalogId);
    if (query.trim().length >= 2) {
      doSearch(query, catalogId);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        <h1 className="text-xl sm:text-2xl font-bold text-stone-800 mb-4">Ürün ara</h1>
        <p className="text-stone-600 text-sm mb-6">
          Tüm firmalar ve kategorilerde ürün adı veya açıklamasında geçen kelimeyle arayın.
        </p>
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="flex gap-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ürün adı veya kelime yazın..."
              className="flex-1 min-h-[48px] border border-stone-300 rounded-lg px-4 py-2.5 text-base"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-amber-500 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50 min-h-[48px]"
            >
              {loading ? "Aranıyor…" : "Ara"}
            </button>
          </div>
        </form>

        {/* Kategori Filtresi */}
        {catalogs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-stone-700 mb-3">Kategorilere göre filtrele:</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleCatalogChange("")}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${
                  selectedCatalog === ""
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-white text-stone-600 border-stone-300 hover:border-amber-400 hover:bg-amber-50"
                }`}
              >
                Tümü
              </button>
              {catalogs.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleCatalogChange(c.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${
                    selectedCatalog === c.id
                      ? "bg-amber-500 text-white border-amber-500"
                      : "bg-white text-stone-600 border-stone-300 hover:border-amber-400 hover:bg-amber-50"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <p className="text-stone-500 text-sm">Aranıyor…</p>
        )}

        {!loading && searched && (
          <>
            {results.length === 0 ? (
              query.trim().length < 2 ? (
                <p className="text-stone-500 text-sm">En az 2 karakter yazın.</p>
              ) : (
                <p className="text-stone-500 text-sm">Bu aramayla eşleşen ürün bulunamadı.</p>
              )
            ) : (
              <p className="text-stone-600 text-sm mb-4">
                <strong>{results.length}</strong> ürün bulundu.
              </p>
            )}
            {results.length > 0 && (
              <ul className="space-y-3">
                {results.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/katalog/${item.catalog.slug}`}
                      className="flex gap-4 p-4 bg-white border border-stone-200 rounded-xl hover:border-amber-300 hover:shadow-sm transition"
                    >
                      {item.imageUrl ? (
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-stone-100">
                          <Image
                            src={item.imageUrl}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg bg-stone-200 flex items-center justify-center text-stone-400 text-xs">
                          Resim yok
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h2 className="font-medium text-stone-800 truncate">{item.name}</h2>
                        {item.description && (
                          <p className="text-sm text-stone-500 line-clamp-2 mt-0.5">{item.description}</p>
                        )}
                        <p className="text-amber-600 font-semibold mt-1">{item.price.toFixed(2)} ₺</p>
                        <p className="text-xs text-stone-400 mt-1">Kategori: {item.catalog.name}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
