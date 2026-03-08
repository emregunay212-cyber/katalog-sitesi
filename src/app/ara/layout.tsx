import { Suspense } from "react";

export default function AraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-50 flex items-center justify-center">Yükleniyor…</div>}>
      {children}
    </Suspense>
  );
}
