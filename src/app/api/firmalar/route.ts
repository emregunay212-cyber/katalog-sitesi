import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Tüm firmaları listeler (müşteri hesabında mağaza seçmek için)
export async function GET() {
  const firms = await prisma.user.findMany({
    where: { role: "firma" },
    select: {
      id: true,
      name: true,
      companyName: true,
      slug: true,
      _count: { select: { catalogs: true } },
    },
    orderBy: { name: "asc" },
  });
  const list = firms
    .filter((f) => f._count.catalogs > 0)
    .map((f) => ({
      id: f.id,
      slug: f.slug,
      name: f.companyName || f.name,
    }));
  return NextResponse.json({ firmalar: list });
}
