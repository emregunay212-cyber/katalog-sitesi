import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { FirmaMusteri } from "./FirmaMusteri";

export const dynamic = "force-dynamic";

export default async function FirmaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await prisma.user.findUnique({
    where: { slug },
    include: {
      catalogs: {
        include: { items: { orderBy: { orderIndex: "asc" } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!user) notFound();

  const firmaDisplayName = user.companyName || user.name;
  return (
    <div className="min-h-screen bg-stone-50">
      <FirmaMusteri
        firma={{ id: user.id, name: firmaDisplayName, slug: user.slug, logoUrl: user.logoUrl ?? null }}
        catalogs={user.catalogs.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          imageUrl: c.imageUrl,
          items: c.items,
        }))}
      />
    </div>
  );
}
