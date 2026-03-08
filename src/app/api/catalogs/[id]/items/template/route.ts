import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

// UTF-8 BOM so Excel opens the file with correct encoding
const BOM = "\uFEFF";

// Sizin tablonuzla aynı: A sütunu = Ürün adı, B sütunu = Fiyat
const TEMPLATE_HEADER = "Ürün adı;Fiyat";
const TEMPLATE_ROW = "MD 01 TURBO 3'LÜ SPRİNK;45";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }
  const { id: catalogId } = await params;
  const catalog = await prisma.catalog.findFirst({
    where: { id: catalogId, userId: user.id },
  });
  if (!catalog) {
    return NextResponse.json({ error: "Katalog bulunamadı." }, { status: 404 });
  }

  const csv = BOM + TEMPLATE_HEADER + "\n" + TEMPLATE_ROW + "\n";
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="urun-sablonu.csv"`,
    },
  });
}
