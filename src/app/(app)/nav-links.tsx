"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type NavLink = { href: string; label: string; badge?: ReactNode };
export type NavGroup = { label: string; links: NavLink[] };

export type MobileTabIcon = "home" | "book" | "calendar" | "chart" | "chat";
export type MobileTab = { href: string; label: string; icon: MobileTabIcon; badge?: ReactNode };

const TAB_ICONS: Record<MobileTabIcon, ReactNode> = {
  home: (
    <>
      <path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
    </>
  ),
  chart: (
    <>
      <path d="M6 20v-6" />
      <path d="M12 20V4" />
      <path d="M18 20V10" />
      <path d="M3 20h18" />
    </>
  ),
  chat: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
};

export function MobileTabBar({ tabs }: { tabs: MobileTab[] }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobil navigatsiya"
      className="fixed bottom-0 left-0 z-30 w-full border-t border-slate-200/70 bg-white/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_-18px_rgba(29,52,96,0.45)] backdrop-blur md:hidden"
    >
      <div className="mx-auto flex max-w-md items-stretch px-1.5">
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <div key={tab.href} className="relative flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 pt-2 pb-1.5 text-[10px] font-medium transition-colors duration-150",
                  active ? "text-brand-900" : "text-slate-500 hover:text-brand-700",
                )}
              >
                <span
                  className={cn(
                    "relative flex h-7 w-12 items-center justify-center rounded-xl transition-colors duration-150",
                    active ? "bg-brand-50 text-brand-900" : "text-slate-500",
                  )}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-5"
                    aria-hidden="true"
                  >
                    {TAB_ICONS[tab.icon]}
                  </svg>
                  {active ? (
                    <span className="absolute -top-0.5 right-1/2 size-1.5 translate-x-4 rounded-full bg-gold-400" />
                  ) : null}
                </span>
                <span className="whitespace-nowrap">{tab.label}</span>
              </Link>
              {tab.badge ? (
                <span
                  inert
                  className="pointer-events-none absolute top-1.5 right-1/2 translate-x-3 [&_a]:size-0 [&_svg]:hidden"
                >
                  {tab.badge}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </nav>
  );
}

export function NavLinks({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.links.map((l) => {
              const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150",
                    active
                      ? "bg-brand-900 text-white shadow-[0_6px_16px_-8px_rgba(29,52,96,0.7)]"
                      : "text-slate-600 hover:bg-brand-50 hover:text-brand-900",
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full transition-colors",
                      active ? "bg-gold-400" : "bg-slate-300 group-hover:bg-brand-400",
                    )}
                  />
                  {l.label}
                  {l.badge ? <span className="ml-auto">{l.badge}</span> : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
