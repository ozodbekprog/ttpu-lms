import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, Stat } from "@/components/ui";
import { cn } from "@/lib/utils";
import AdminOrdersManager, {
  type AdminOrderItem,
} from "@/components/orders/AdminOrdersManager";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABEL,
  isOrderStatus,
} from "@/components/orders/shared";

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors duration-150",
        active
          ? "border-brand-900 bg-brand-900 text-white shadow-sm"
          : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50",
      )}
    >
      {children}
    </Link>
  );
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole(["ADMIN"]);
  const params = await searchParams;
  const status =
    typeof params.status === "string" && isOrderStatus(params.status) ? params.status : "";

  const [orders, grouped] = await Promise.all([
    prisma.order.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            group: { select: { name: true } },
          },
        },
      },
    }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
  ]);

  const counts: Record<string, number> = {};
  let total = 0;
  for (const row of grouped) {
    counts[row.status] = row._count;
    total += row._count;
  }

  const items: AdminOrderItem[] = orders.map((order) => ({
    id: order.id,
    type: order.type,
    subject: order.subject,
    note: order.note,
    status: order.status,
    adminComment: order.adminComment,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    user: order.user,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Boshqaruv"
        title="Arizalar"
        subtitle="Talabalar va xodimlar so'rovlarini ko'rib chiqish"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Jami" value={total} hint="Barcha arizalar" />
        <Stat label="Yangi" value={counts.NEW ?? 0} hint="Ko'rib chiqilmagan" />
        <Stat label="Jarayonda" value={counts.IN_PROGRESS ?? 0} hint="Ishlanmoqda" />
        <Stat label="Bajarildi" value={counts.DONE ?? 0} hint="Yakunlangan" />
        <Stat label="Rad etildi" value={counts.REJECTED ?? 0} hint="Bekor qilingan" />
      </div>

      <div className="mb-4 mt-6 flex flex-wrap items-center gap-2">
        <FilterLink href="/admin/orders" active={!status}>
          Barchasi ({total})
        </FilterLink>
        {ORDER_STATUSES.map((value) => (
          <FilterLink
            key={value}
            href={`/admin/orders?status=${value}`}
            active={status === value}
          >
            {ORDER_STATUS_LABEL[value]} ({counts[value] ?? 0})
          </FilterLink>
        ))}
      </div>

      <AdminOrdersManager orders={items} />
    </>
  );
}
