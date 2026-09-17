"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Umumiy" },
  { href: "/admin/users", label: "Foydalanuvchilar" },
  { href: "/admin/groups", label: "Guruhlar" },
  { href: "/admin/courses", label: "Kurslar" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex w-fit flex-wrap items-center gap-1 rounded-2xl border border-slate-200/70 bg-white p-1.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      {LINKS.map((link) => {
        const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-xl px-3.5 py-1.5 text-sm font-medium transition-all duration-150",
              active
                ? "bg-brand-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-brand-900",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
