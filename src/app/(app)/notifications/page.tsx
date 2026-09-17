import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge, Card, CardBody, EmptyState, PageHeader } from "@/components/ui";
import { cn, fmtDateTime } from "@/lib/utils";
import { MarkAllReadButton } from "@/components/notifications/MarkAllReadButton";

export default async function NotificationsPage() {
  const user = await requireUser();

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.notification.count({ where: { userId: user.id, isRead: false } }),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Xabarlar"
        title="Bildirishnomalar"
        subtitle={unreadCount > 0 ? `${unreadCount} ta o'qilmagan` : "Hammasi o'qilgan"}
        action={unreadCount > 0 ? <MarkAllReadButton /> : undefined}
      />

      {notifications.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              title="Bildirishnomalar yo'q"
              description="Yangi xabarlar shu yerda ko'rinadi."
            />
          </CardBody>
        </Card>
      ) : (
        <ul className="space-y-3">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={cn(
                "relative overflow-hidden rounded-2xl border px-5 py-4 transition-colors duration-150",
                n.isRead
                  ? "border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
                  : "border-brand-100 bg-brand-50/50 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_28px_-18px_rgba(29,52,96,0.35)]",
              )}
            >
              {n.isRead ? null : <span className="absolute inset-y-0 left-0 w-1 bg-brand-900" />}
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl",
                      n.isRead ? "bg-slate-100 text-slate-400" : "bg-white text-brand-800 ring-1 ring-brand-100",
                    )}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={cn("font-medium", n.isRead ? "text-slate-800" : "text-brand-950")}>
                        {n.title}
                      </p>
                      {n.isRead ? null : <Badge tone="brand">Yangi</Badge>}
                    </div>
                    {n.body ? <p className="mt-1 text-sm leading-relaxed text-slate-600">{n.body}</p> : null}
                    {n.link ? (
                      <Link
                        href={n.link}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-700 transition-colors duration-150 hover:text-brand-900"
                      >
                        Batafsil
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </Link>
                    ) : null}
                  </div>
                </div>
                <span className="shrink-0 text-xs text-slate-400">{fmtDateTime(n.createdAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
