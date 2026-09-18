import type { ReactNode } from "react";
import { Badge } from "@/components/ui";

const CATEGORIES: { label: string; tone: string }[] = [
  { label: "Kurslar", tone: "brand" },
  { label: "Materiallar", tone: "amber" },
  { label: "Topshiriqlar", tone: "green" },
  { label: "Testlar", tone: "purple" },
  { label: "Foydalanuvchilar", tone: "blue" },
];

export function SearchEmpty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="animate-fade-up flex flex-col items-center rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center">
      <span className="relative inline-flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-900 to-brand-600 text-white shadow-lift">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span className="absolute -right-1.5 -top-1.5 inline-flex size-6 items-center justify-center rounded-full bg-gold-400 text-xs font-bold text-brand-950 ring-2 ring-white">
          ?
        </span>
      </span>
      <p className="mt-5 text-lg font-semibold tracking-tight text-slate-900">{title}</p>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-slate-500">{description}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {CATEGORIES.map((item) => (
          <Badge key={item.label} tone={item.tone}>
            {item.label}
          </Badge>
        ))}
      </div>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
