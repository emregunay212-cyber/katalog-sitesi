import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Herkes katalog sayfasını görebilir (slug ile)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const catalog = await prisma.catalog.findUnique({
    where: { slug },
    include: {
      items: { orderBy: { orderIndex: "asc" } },
    },
  });
  if (!catalog) {
    return NextResponse.json({ error: "Katalog bulunamadı." }, { status: 404 });
  }
  return NextResponse.json({
    catalog: {
      id: catalog.id,
      name: catalog.name,
      description: catalog.description,
      slug: catalog.slug,
      items: catalog.items,
    },
  });
}
