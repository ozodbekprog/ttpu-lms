import Link from "next/link";
import { requireUser, isStaff } from "@/lib/auth";
import { Avatar } from "@/components/ui";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { UnreadBadge } from "@/components/chat/UnreadBadge";
import { Logo } from "@/components/brand/logo";
import { NavLinks } from "./nav-links";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/courses", label: "Kurslar" },
    { href: "/catalog", label: "Katalog" },
    { href: "/schedule", label: "Jadval" },
    { href: "/calendar", label: "Kalendar" },
    { href: "/grades", label: isStaff(user.role) ? "Baholash" : "Baholarim" },
    { href: "/certificates", label: "Sertifikatlar" },
    { href: "/messages", label: "Xabarlar", badge: <UnreadBadge /> },
    ...(isStaff(user.role) ? [{ href: "/reports", label: "Hisobotlar" }] : []),
    ...(user.role === "ADMIN" ? [{ href: "/admin", label: "Admin panel" }] : []),
  ];

  const roleLabel =
    user.role === "ADMIN"
      ? "Administrator"
      : user.role === "TEACHER"
        ? "O'qituvchi"
        : user.group?.name ?? "Talaba";

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200/70 bg-white md:flex">
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <Link href="/dashboard" className="transition-opacity hover:opacity-80">
            <Logo />
          </Link>
          <NotificationBell />
        </div>
        <NavLinks links={links} />
        <div className="border-t border-slate-100 p-3">
          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 transition-colors hover:bg-brand-50"
          >
            <Avatar name={user.name} src={user.avatarUrl} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{roleLabel}</p>
            </div>
          </Link>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="m16 17 5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
              Chiqish
            </button>
          </form>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-slate-200/70 bg-white/90 px-4 backdrop-blur md:hidden">
          <Link href="/dashboard">
            <Logo size={30} withText={false} />
          </Link>
          <NavLinks links={links} variant="top" />
          <NotificationBell />
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
