"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Suggestion = {
  id: string;
  name: string;
  price: number;
  catalog: { name: string; slug: string };
};

export function SearchBox() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/ara?q=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        const results: Suggestion[] = (data.results ?? []).slice(0, 5);
        setSuggestions(results);
        setOpen(results.length > 0);
      } catch {
        setSuggestions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    setOpen(false);
    router.push(`/ara?q=${encodeURIComponent(trimmed)}`);
  }

  function goToMore() {
    setOpen(false);
    router.push(`/ara?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div ref={wrapperRef} className="relative flex-1 min-w-0 max-w-xs sm:max-w-sm">
      <form onSubmit={handleSubmit}>
        <input
          type="search"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
          placeholder="Ürün ara..."
          className="w-full min-h-[36px] sm:min-h-[40px] border border-stone-300 rounded-lg px-3 py-1.5 text-sm"
        />
      </form>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg z-50 overflow-hidden">
          <ul>
            {suggestions.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/katalog/${item.catalog.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between px-3 py-2 hover:bg-stone-50 transition text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-stone-800 font-medium truncate block">{item.name}</span>
                    <span className="text-stone-400 text-xs">{item.catalog.name}</span>
                  </div>
                  <span className="text-amber-600 font-semibold text-sm ml-2 shrink-0">
                    {item.price.toFixed(2)} ₺
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={goToMore}
            className="w-full px-3 py-2 text-sm text-amber-600 font-medium hover:bg-amber-50 border-t border-stone-100 text-center"
          >
            Daha fazla sonuç göster →
          </button>
        </div>
      )}
    </div>
  );
}
