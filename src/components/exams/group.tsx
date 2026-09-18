import type { ReactNode } from "react";
import { Badge } from "@/components/ui";

const DOT_TONES = {
  blue: "bg-brand-500",
  amber: "bg-amber-400",
  slate: "bg-slate-300",
};

export function ExamGroupSection({
  title,
  tone,
  count,
  children,
}: {
  title: string;
  tone: keyof typeof DOT_TONES;
  count: number;
  children: ReactNode;
}) {
  if (count === 0) return null;
  return (
    <section className="mb-8 last:mb-0">
      <div className="mb-3 flex items-center gap-2">
        <span className={`size-2 rounded-full ${DOT_TONES[tone]}`} />
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">{title}</h2>
        <Badge tone={tone}>{count}</Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
}
