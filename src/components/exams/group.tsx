import type { ReactNode } from "react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

const TONES = {
  blue: {
    box: "bg-brand-50 text-brand-700 ring-brand-100",
    line: "from-brand-200",
  },
  amber: {
    box: "bg-amber-50 text-amber-600 ring-amber-100",
    line: "from-amber-200",
  },
  slate: {
    box: "bg-slate-100 text-slate-500 ring-slate-200",
    line: "from-slate-200",
  },
} as const;

function GroupIcon({ tone }: { tone: keyof typeof TONES }) {
  return (
    <span className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-xl ring-1", TONES[tone].box)}>
      {tone === "blue" ? (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
          <path d="M12 14v3l2 1" />
        </svg>
      ) : tone === "amber" ? (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
          <path d="M3 3v5h5" />
          <path d="M12 7v5l3 2" />
        </svg>
      )}
    </span>
  );
}

export function ExamGroupSection({
  title,
  tone,
  count,
  subtitle,
  children,
}: {
  title: string;
  tone: keyof typeof TONES;
  count: number;
  subtitle?: string;
  children: ReactNode;
}) {
  if (count === 0) return null;
  return (
    <section className="mb-9 last:mb-0">
      <div className="mb-4 flex items-center gap-3">
        <GroupIcon tone={tone} />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-700">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p> : null}
        </div>
        <span className={cn("mx-1 hidden h-px flex-1 bg-gradient-to-r to-transparent sm:block", TONES[tone].line)} />
        <Badge tone={tone}>{count} ta</Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
}
