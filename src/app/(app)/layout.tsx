import Link from "next/link";
import { requireUser, isStaff } from "@/lib/auth";
import { Avatar } from "@/components/ui";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/courses", label: "Kurslar" },
    { href: "/schedule", label: "Jadval" },
    { href: "/grades", label: isStaff(user.role) ? "Baholash" : "Baholarim" },
    ...(user.role === "ADMIN" ? [{ href: "/admin", label: "Admin panel" }] : []),
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-14 items-center justify-between border-b border-slate-100 px-5">
          <Link href="/dashboard" className="text-sm font-bold tracking-tight text-slate-900">
            TTPU <span className="text-blue-600">LMS</span>
          </Link>
          <NotificationBell />
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <Avatar name={user.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
              <p className="truncate text-xs text-slate-500">
                {user.role === "ADMIN" ? "Administrator" : user.role === "TEACHER" ? "O'qituvchi" : user.group?.name ?? "Talaba"}
              </p>
            </div>
          </div>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Chiqish
            </button>
          </form>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
          <Link href="/dashboard" className="text-sm font-bold text-slate-900">
            TTPU <span className="text-blue-600">LMS</span>
          </Link>
          <div className="flex items-center gap-2">
            <nav className="flex gap-1 overflow-x-auto">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
