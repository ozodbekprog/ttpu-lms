import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge, Card, CardBody, PageHeader } from "@/components/ui";
import { cn, fmtDateTime } from "@/lib/utils";
import { MarkAllReadButton } from "@/components/notifications/MarkAllReadButton";
import {
  NotificationIcon,
  notificationKind,
  notificationStyle,
} from "@/components/notifications/shared";

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
        <Card className="animate-fade-up">
          <CardBody className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
            </span>
            <div>
              <p className="font-medium text-slate-800">Bildirishnomalar yo&apos;q</p>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                Yangi xabar, baho yoki jadval o&apos;zgarishlari shu yerda ko&apos;rinadi.
              </p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-4 left-4 top-4 w-px bg-gradient-to-b from-slate-200 via-slate-200 to-transparent"
          />
          <ol>
            {notifications.map((n, index) => {
              const kind = notificationKind(n);
              const style = notificationStyle(kind);
              return (
                <li
                  key={n.id}
                  className="animate-fade-up relative pb-4 pl-12 last:pb-0"
                  style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
                >
                  <span
                    className={cn(
                      "absolute left-0 top-4 z-10 inline-flex size-8 items-center justify-center rounded-full ring-4 ring-surface",
                      style.wrap,
                    )}
                  >
                    <NotificationIcon kind={kind} />
                  </span>
                  <div
                    className={cn(
                      "relative overflow-hidden rounded-2xl border px-5 py-4 transition-all duration-200",
                      n.isRead
                        ? "border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:border-slate-300"
                        : "border-brand-100 bg-brand-50/40 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_28px_-18px_rgba(29,52,96,0.4)] hover:border-brand-200",
                    )}
                  >
                    {n.isRead ? null : (
                      <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand-700 to-brand-950" />
                    )}
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1",
                              style.wrap,
                            )}
                          >
                            <span className={cn("size-1.5 rounded-full", style.dot)} />
                            {style.label}
                          </span>
                          {n.isRead ? null : <Badge tone="brand">Yangi</Badge>}
                        </div>
                        <p
                          className={cn(
                            "mt-2 text-sm leading-snug",
                            n.isRead ? "font-medium text-slate-800" : "font-semibold text-brand-950",
                          )}
                        >
                          {n.title}
                        </p>
                        {n.body ? (
                          <p className="mt-1 text-sm leading-relaxed text-slate-600">{n.body}</p>
                        ) : null}
                        {n.link ? (
                          <Link
                            href={n.link}
                            className="group mt-2.5 inline-flex items-center gap-1 text-xs font-medium text-brand-700 transition-colors duration-150 hover:text-brand-900"
                          >
                            Batafsil
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="transition-transform duration-150 group-hover:translate-x-0.5"
                            >
                              <path d="m9 18 6-6-6-6" />
                            </svg>
                          </Link>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-xs text-slate-400">{fmtDateTime(n.createdAt)}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </>
  );
}
