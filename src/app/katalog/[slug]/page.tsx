import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { KatalogMusteri } from "./KatalogMusteri";

export const dynamic = "force-dynamic";

export default async function KatalogPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const catalog = await prisma.catalog.findUnique({
    where: { slug },
    include: { items: { orderBy: { orderIndex: "asc" } } },
  });
  if (!catalog) notFound();

  return (
    <div className="min-h-screen bg-stone-50">
      <KatalogMusteri
        catalog={{ id: catalog.id, name: catalog.name, description: catalog.description, slug: catalog.slug }}
        items={catalog.items}
      />
    </div>
  );
}
