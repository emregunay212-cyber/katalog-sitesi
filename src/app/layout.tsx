import type { Metadata, Viewport } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Katalog & Sipariş",
  description: "Yerel firma katalog ve sipariş yönetimi",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
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
        <SpeedInsights />
      </body>
    </html>
  );
}
