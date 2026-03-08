import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as XLSX from "xlsx";

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

  const wb = XLSX.utils.book_new();
  const data: (string | number)[][] = [
    ["Ürün adı", "Fiyat"],
    ["MD 01 TURBO 3'LÜ SPRİNK", 45],
    ["", ""],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = [{ wch: 45 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws, "Ürünler");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="urun-sablonu.xlsx"',
    },
  });
}
