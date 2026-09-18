import { cn } from "@/lib/utils";

const BADGE_SIZES = {
  sm: "size-8 text-[9px]",
  md: "size-10 text-xs",
  lg: "size-12 text-sm",
  xl: "size-24 text-2xl",
};

export function gradeBadgeTone(percent: number | null) {
  if (percent == null) return "bg-slate-100 text-slate-300 ring-1 ring-slate-200/70";
  if (percent >= 80) return "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30";
  if (percent >= 60) return "bg-amber-500 text-white shadow-sm shadow-amber-500/30";
  return "bg-rose-500 text-white shadow-sm shadow-rose-500/30";
}

export function GradeBadge({
  percent,
  size = "md",
  className,
}: {
  percent: number | null;
  size?: keyof typeof BADGE_SIZES;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold tabular-nums",
        BADGE_SIZES[size],
        gradeBadgeTone(percent),
        className,
      )}
    >
      {percent != null ? `${percent}%` : "—"}
    </span>
  );
}
