import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { fmtDateTime } from "@/lib/utils";
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
        title="Bildirishnomalar"
        subtitle={unreadCount > 0 ? `${unreadCount} ta o'qilmagan` : "Hammasi o'qilgan"}
        action={unreadCount > 0 ? <MarkAllReadButton /> : undefined}
      />
      <Card>
        {notifications.length === 0 ? (
          <EmptyState
            title="Bildirishnomalar yo'q"
            description="Yangi xabarlar shu yerda ko'rinadi."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <li key={n.id} className={n.isRead ? "px-5 py-4" : "bg-blue-50/40 px-5 py-4"}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {n.isRead ? null : (
                        <span className="size-2 shrink-0 rounded-full bg-blue-600" />
                      )}
                      <p className="font-medium text-slate-900">{n.title}</p>
                    </div>
                    {n.body ? <p className="mt-1 text-sm text-slate-600">{n.body}</p> : null}
                    {n.link ? (
                      <Link
                        href={n.link}
                        className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline"
                      >
                        Batafsil
                      </Link>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-xs text-slate-400">{fmtDateTime(n.createdAt)}</span>
                    <Badge tone={n.isRead ? "slate" : "blue"}>
                      {n.isRead ? "O'qilgan" : "Yangi"}
                    </Badge>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
