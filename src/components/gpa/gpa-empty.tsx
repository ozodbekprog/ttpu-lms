import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TIPS = [
  { label: "Avtomatik hisob", bar: "bg-emerald-400" },
  { label: "4.0 shkala", bar: "bg-gold-400" },
  { label: "Kurslar kesimida", bar: "bg-brand-400" },
];

export function GpaEmpty({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="animate-fade-up relative overflow-hidden rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center">
      <span className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-gold-300/20 blur-3xl" />
      <span className="pointer-events-none absolute -bottom-24 -left-16 size-56 rounded-full bg-brand-200/30 blur-3xl" />
      <div className="relative mx-auto flex size-24 items-center justify-center">
        <span className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-br from-brand-100 via-white to-gold-300/40" />
        <span className="absolute inset-2 rounded-full border border-dashed border-brand-300" />
        <span className="relative text-2xl font-semibold tracking-tight text-brand-700">GPA</span>
      </div>
      <p className="relative mt-5 text-lg font-semibold text-slate-800">{title}</p>
      {description ? (
        <p className="relative mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-slate-500">
          {description}
        </p>
      ) : null}
      {action ? <div className="relative mt-5 flex justify-center">{action}</div> : null}
      <div className="relative mt-6 flex flex-wrap items-center justify-center gap-2">
        {TIPS.map((tip) => (
          <span
            key={tip.label}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500"
          >
            <span className={cn("size-1.5 rounded-full", tip.bar)} />
            {tip.label}
          </span>
        ))}
      </div>
    </div>
  );
}
