"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavLink = { href: string; label: string };

export function NavLinks({ links, variant = "side" }: { links: NavLink[]; variant?: "side" | "top" }) {
  const pathname = usePathname();

  if (variant === "top") {
    return (
      <nav className="flex gap-1 overflow-x-auto">
        {links.map((l) => {
          const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                active ? "bg-brand-900 text-white" : "text-slate-600 hover:bg-slate-100",
              )}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="flex-1 space-y-0.5 px-3 py-4">
      {links.map((l) => {
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
          </Link>
        );
      })}
    </nav>
  );
}
