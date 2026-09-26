import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge, Card, PageHeader, Progress } from "@/components/ui";
import { cn } from "@/lib/utils";
import AdminOrdersManager, {
  type AdminOrderItem,
} from "@/components/orders/AdminOrdersManager";
import {
  ORDER_STATUS_DOT,
  ORDER_STATUS_LABEL,
  ORDER_STATUSES,
  isOrderStatus,
  type OrderStatus,
} from "@/components/orders/shared";
import type { ReactNode } from "react";

const STAT_TONES = {
  brand: "bg-brand-50 text-brand-700 ring-brand-100",
  blue: "bg-brand-50 text-brand-700 ring-brand-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  rose: "bg-rose-50 text-rose-600 ring-rose-100",
  slate: "bg-slate-100 text-slate-500 ring-slate-200",
} as const;

const FILTER_DOT: Record<OrderStatus, string> = ORDER_STATUS_DOT;

const STAT_ICONS: Record<string, ReactNode> = {
  total: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
    </svg>
  ),
  new: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16v12H8l-4 4z" />
      <path d="M8 9h8M8 12h5" />
    </svg>
  ),
  progress: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  done: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </svg>
  ),
  rejected: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="m9.5 9.5 5 5M14.5 9.5l-5 5" />
    </svg>
  ),
  filter: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M7 12h10M10 18h4" />
    </svg>
  ),
};

function StatusCard({
  label,
  value,
  total,
  tone,
  icon,
}: {
  label: string;
  value: number;
  total: number;
  tone: keyof typeof STAT_TONES;
  icon: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <Card className="p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex items-center justify-between gap-2">
        <span className={cn("inline-flex size-10 items-center justify-center rounded-xl ring-1", STAT_TONES[tone])}>
          {STAT_ICONS[icon]}
        </span>
        <span className="text-xs font-semibold text-slate-600">{pct}%</span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-brand-950">{value}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-500">{label}</p>
      <Progress value={value} max={Math.max(1, total)} className="mt-3.5" />
    </Card>
  );
}

function FilterLink({
  href,
  active,
  dot,
  children,
  count,
}: {
  href: string;
  active: boolean;
  dot?: string;
  children: ReactNode;
  count: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors duration-150",
        active
          ? "border-brand-900 bg-brand-900 text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
      )}
    >
      {dot ? <span className={cn("size-2 rounded-full", dot)} /> : null}
      {children}
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
          active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500",
        )}
      >
        {count}
      </span>
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
        <StatusCard label="Jami arizalar" value={total} total={total} tone="slate" icon="total" />
        <StatusCard label="Yangi" value={counts.NEW ?? 0} total={total} tone="blue" icon="new" />
        <StatusCard
          label="Jarayonda"
          value={counts.IN_PROGRESS ?? 0}
          total={total}
          tone="amber"
          icon="progress"
        />
        <StatusCard label="Bajarildi" value={counts.DONE ?? 0} total={total} tone="emerald" icon="done" />
        <StatusCard
          label="Rad etildi"
          value={counts.REJECTED ?? 0}
          total={total}
          tone="rose"
          icon="rejected"
        />
      </div>

      <Card className="mb-4 mt-6 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="ml-1 mr-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
            {STAT_ICONS.filter}
            Filtr
          </span>
          <FilterLink href="/admin/orders" active={!status} count={total}>
            Barchasi
          </FilterLink>
          {ORDER_STATUSES.map((value) => (
            <FilterLink
              key={value}
              href={`/admin/orders?status=${value}`}
              active={status === value}
              dot={FILTER_DOT[value]}
              count={counts[value] ?? 0}
            >
              {ORDER_STATUS_LABEL[value]}
            </FilterLink>
          ))}
          <span className="ml-auto hidden items-center gap-2 pr-2 text-xs text-slate-600 sm:inline-flex">
            <Badge tone="slate">{orders.length} ta natija</Badge>
          </span>
        </div>
      </Card>

      <AdminOrdersManager orders={items} />
    </>
  );
}
