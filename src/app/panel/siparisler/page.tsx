import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { SiparislerClient } from "./SiparislerClient";

export default async function SiparislerPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: {
      items: {
        include: {
          catalogItem: { include: { catalog: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const unreadCount = orders.filter((o) => o.status === "pending" && !o.readByOwner).length;
  const pending = orders.filter((o) => o.status === "pending");
  const completed = orders.filter((o) => o.status === "completed" || o.status === "cancelled");

  return (
    <div>
      <Link href="/panel" className="text-stone-500 text-sm hover:underline mb-4 inline-block">
        ← Panel
      </Link>
      <h1 className="text-2xl font-bold text-stone-800 mb-4">Siparişler</h1>
      {unreadCount > 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg">
          <span className="font-medium">Yeni siparişiniz var!</span> {unreadCount} okunmamış sipariş
        </div>
      )}
      <SiparislerClient
        pendingOrders={JSON.parse(JSON.stringify(pending))}
        completedOrders={JSON.parse(JSON.stringify(completed))}
      />
    </div>
  );
}
