import type { ReactNode } from "react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

export type ProfileStatKind = "courses" | "certificates" | "average" | "students" | "users";

const STAT_TONES: Record<ProfileStatKind, string> = {
  courses: "bg-brand-50 text-brand-700 ring-brand-100",
  certificates: "bg-gold-300/20 text-gold-600 ring-gold-300/40",
  average: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  students: "bg-purple-50 text-purple-600 ring-purple-100",
  users: "bg-sky-50 text-sky-600 ring-sky-100",
};

const STAT_ICONS: Record<ProfileStatKind, ReactNode> = {
  courses: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  certificates: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="9" r="5.5" />
      <path d="m8.5 13.5-1 8 4.5-2.4 4.5 2.4-1-8" />
    </svg>
  ),
  average: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
    </svg>
  ),
  students: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  users: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="m16 11 2 2 4-4" />
    </svg>
  ),
};

export type ProfileStat = {
  kind: ProfileStatKind;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
};

export function StatsRow({ items }: { items: ProfileStat[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map((item, index) => (
        <div key={item.label} className="animate-fade-up" style={{ animationDelay: `${index * 70}ms` }}>
          <Card className="group relative h-full overflow-hidden p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
            <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-900 via-brand-500 to-gold-400 opacity-60 transition-opacity duration-200 group-hover:opacity-100" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">{item.label}</p>
                <p className="mt-1.5 text-3xl font-semibold tracking-tight text-brand-950">{item.value}</p>
                {item.hint ? <p className="mt-1 text-xs text-slate-400">{item.hint}</p> : null}
              </div>
              <span
                className={cn(
                  "inline-flex size-11 shrink-0 items-center justify-center rounded-2xl ring-1 transition-transform duration-200 group-hover:scale-105",
                  STAT_TONES[item.kind],
                )}
              >
                {STAT_ICONS[item.kind]}
              </span>
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
}
