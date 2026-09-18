import { cn } from "@/lib/utils";
import type { GpaLetter } from "@/app/api/gpa/data";

const BADGE_SIZES = {
  sm: "size-7 text-[10px]",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
};

export const LETTER_META: Record<
  GpaLetter,
  { label: string; gradient: string; soft: string; bar: string }
> = {
  A: {
    label: "A'lo",
    gradient:
      "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-emerald-500/30",
    soft: "border-emerald-200/70 bg-emerald-50 text-emerald-700",
    bar: "bg-emerald-400",
  },
  B: {
    label: "Yaxshi",
    gradient: "bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-brand-500/30",
    soft: "border-brand-200/70 bg-brand-50 text-brand-700",
    bar: "bg-brand-400",
  },
  C: {
    label: "Qoniqarli",
    gradient: "bg-gradient-to-br from-gold-300 to-gold-600 text-white shadow-gold-500/30",
    soft: "border-gold-300/70 bg-gold-300/15 text-gold-600",
    bar: "bg-gold-400",
  },
  D: {
    label: "O'tish",
    gradient: "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-amber-500/30",
    soft: "border-amber-200/70 bg-amber-50 text-amber-700",
    bar: "bg-amber-400",
  },
  F: {
    label: "Qoniqarsiz",
    gradient: "bg-gradient-to-br from-rose-400 to-rose-600 text-white shadow-rose-500/30",
    soft: "border-rose-200/70 bg-rose-50 text-rose-700",
    bar: "bg-rose-400",
  },
};

export function LetterBadge({
  letter,
  size = "md",
  className,
}: {
  letter: GpaLetter;
  size?: keyof typeof BADGE_SIZES;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold shadow-sm",
        BADGE_SIZES[size],
        LETTER_META[letter].gradient,
        className,
      )}
    >
      {letter}
    </span>
  );
}

export function gpaPointsTone(points: number) {
  if (points >= 4) return LETTER_META.A.gradient;
  if (points >= 3.3) return LETTER_META.B.gradient;
  if (points >= 2.7) return LETTER_META.C.gradient;
  if (points >= 2) return LETTER_META.D.gradient;
  return LETTER_META.F.gradient;
}

export function GpaPointsBadge({
  points,
  size = "md",
  digits = 1,
  className,
}: {
  points: number;
  size?: keyof typeof BADGE_SIZES;
  digits?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold tabular-nums shadow-sm",
        BADGE_SIZES[size],
        gpaPointsTone(points),
        className,
      )}
    >
      {points.toFixed(digits)}
    </span>
  );
}
