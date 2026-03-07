import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Katalog & Sipariş",
  description: "Yerel firma katalog ve sipariş yönetimi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">
        {children}
      </body>
    </html>
  );
}
