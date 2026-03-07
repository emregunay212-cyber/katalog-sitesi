import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { CatalogDetailClient } from "./CatalogDetailClient";

export const dynamic = "force-dynamic";

export default async function CatalogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { id } = await params;

  const catalog = await prisma.catalog.findFirst({
    where: { id, userId: user.id },
    include: { items: { orderBy: { orderIndex: "asc" } } },
  });

  if (!catalog) notFound();

  return (
    <div>
      <Link
        href="/panel"
        className="text-stone-500 text-sm hover:underline mb-4 inline-block"
      >
        ← Kataloglar
      </Link>
      <Link
        href="/panel/siparisler"
        className="ml-4 text-sm text-amber-600 hover:underline"
      >
        Tüm siparişler →
      </Link>

      <CatalogDetailClient
        catalogId={catalog.id}
        catalogName={catalog.name}
        catalogDescription={catalog.description}
        catalogImageUrl={catalog.imageUrl}
        initialItems={catalog.items}
      />
    </div>
  );
}
