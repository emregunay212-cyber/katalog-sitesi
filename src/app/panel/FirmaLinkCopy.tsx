"use client";

import { useState } from "react";

export function FirmaLinkCopy({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 mt-2 flex-wrap">
      <code className="text-amber-600 font-mono text-sm break-all bg-stone-100 px-2 py-1 rounded">
        {url}
      </code>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="text-sm text-amber-600 hover:underline whitespace-nowrap"
      >
        {copied ? "Kopyalandı!" : "Kopyala"}
      </button>
    </div>
  );
}
