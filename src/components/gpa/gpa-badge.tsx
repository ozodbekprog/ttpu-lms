import { cn } from "@/lib/utils";
import type { GpaLetter } from "@/app/api/gpa/data";

const BADGE_SIZES = {
  sm: "size-7 text-[10px]",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
};

const LETTER_TONES: Record<GpaLetter, string> = {
  A: "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30",
  B: "bg-brand-500 text-white shadow-sm shadow-brand-500/30",
  C: "bg-gold-400 text-white shadow-sm shadow-gold-500/30",
  D: "bg-amber-500 text-white shadow-sm shadow-amber-500/30",
  F: "bg-rose-500 text-white shadow-sm shadow-rose-500/30",
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
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold",
        BADGE_SIZES[size],
        LETTER_TONES[letter],
        className,
      )}
    >
      {letter}
    </span>
  );
}

export function gpaPointsTone(points: number) {
  if (points >= 3.7) return "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30";
  if (points >= 3.0) return "bg-brand-500 text-white shadow-sm shadow-brand-500/30";
  if (points >= 2.5) return "bg-gold-400 text-white shadow-sm shadow-gold-500/30";
  if (points >= 2.0) return "bg-amber-500 text-white shadow-sm shadow-amber-500/30";
  return "bg-rose-500 text-white shadow-sm shadow-rose-500/30";
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
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold tabular-nums",
        BADGE_SIZES[size],
        gpaPointsTone(points),
        className,
      )}
    >
      {points.toFixed(digits)}
    </span>
  );
}
