"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn, fmtDateTime } from "@/lib/utils";
import type { NotificationItem } from "./shared";
import { NotificationIcon, notificationKind, notificationStyle } from "./shared";

type NotificationsResponse = {
  ok: boolean;
  data?: { notifications: NotificationItem[]; unreadCount: number };
  error?: string;
};

export function NotificationBell() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as NotificationsResponse | null;
      if (!res.ok || !json?.ok || !json.data) return;
      setItems(json.data.notifications);
      setUnreadCount(json.data.unreadCount);
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      void load();
    }, 30000);
    void Promise.resolve().then(load);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    function onDocumentClick(event: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocumentClick);
    return () => document.removeEventListener("mousedown", onDocumentClick);
  }, [open]);

  async function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      if (!res.ok) {
        await load();
      }
    } catch {
      await load();
    }
  }

  async function onItemClick(notification: NotificationItem) {
    if (!notification.isRead) {
      await markRead(notification.id);
    }
    setOpen(false);
    if (notification.link) {
      router.push(notification.link);
    }
  }

  const sections = [
    { key: "unread", label: "Yangi", entries: items.filter((n) => !n.isRead).slice(0, 4) },
    { key: "read", label: "O'qilgan", entries: items.filter((n) => n.isRead).slice(0, 4) },
  ].filter((section) => section.entries.length > 0);

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Bildirishnomalar"
        aria-expanded={open}
        className={cn(
          "relative inline-flex size-9 items-center justify-center rounded-xl transition-colors duration-150",
          open
            ? "bg-brand-50 text-brand-900"
            : "text-slate-500 hover:bg-brand-50 hover:text-brand-900",
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 inline-flex min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] leading-4 font-semibold text-white ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="animate-fade-up absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-lift">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-brand-950">Bildirishnomalar</p>
            {unreadCount > 0 ? (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
                {unreadCount} ta yangi
              </span>
            ) : (
              <span className="text-[11px] text-slate-600">Hammasi o&apos;qilgan</span>
            )}
          </div>

          {items.length === 0 ? (
            <div className="animate-fade-up flex flex-col items-center gap-2.5 px-4 py-10 text-center">
              <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-medium text-slate-700">Bildirishnomalar yo&apos;q</p>
                <p className="mt-0.5 text-xs text-slate-600">Yangi xabarlar shu yerda ko&apos;rinadi</p>
              </div>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {sections.map((section, sectionIndex) => (
                <div key={section.key} className={cn(sectionIndex > 0 && "border-t border-slate-100")}>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                    {section.label}
                  </p>
                  <ul className="divide-y divide-slate-100">
                    {section.entries.map((n, index) => {
                      const kind = notificationKind(n);
                      const style = notificationStyle(kind);
                      return (
                        <li
                          key={n.id}
                          className="animate-fade-up"
                          style={{ animationDelay: `${Math.min(sectionIndex * 4 + index, 8) * 30}ms` }}
                        >
                          <button
                            type="button"
                            onClick={() => void onItemClick(n)}
                            className={cn(
                              "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-150",
                              n.isRead ? "hover:bg-slate-50" : "bg-brand-50/40 hover:bg-brand-50/70",
                            )}
                          >
                            <span
                              className={cn(
                                "mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-xl ring-1",
                                style.wrap,
                              )}
                            >
                              <NotificationIcon kind={kind} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "min-w-0 flex-1 truncate text-sm",
                                    n.isRead ? "font-medium text-slate-600" : "font-semibold text-brand-950",
                                  )}
                                >
                                  {n.title}
                                </span>
                                {n.isRead ? null : (
                                  <span className="size-1.5 shrink-0 rounded-full bg-brand-900" />
                                )}
                              </span>
                              {n.body ? (
                                <span className="mt-0.5 block truncate text-xs text-slate-500">
                                  {n.body}
                                </span>
                              ) : null}
                              <span className="mt-1 block text-[11px] text-slate-600">
                                {fmtDateTime(n.createdAt)}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}

          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1 border-t border-slate-100 px-4 py-2.5 text-sm font-medium text-brand-700 transition-colors duration-150 hover:bg-brand-50 hover:text-brand-900"
          >
            Barchasini ko&apos;rish
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
