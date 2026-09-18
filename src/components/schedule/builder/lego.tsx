import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TONES = [
  "border-brand-200 bg-brand-50 text-brand-900",
  "border-gold-300/80 bg-gold-300/20 text-brand-950",
  "border-slate-200 bg-slate-50 text-slate-800",
  "border-brand-300 bg-brand-100/80 text-brand-900",
  "border-gold-300 bg-gold-300/35 text-brand-950",
  "border-slate-300 bg-slate-100/80 text-slate-800",
];

const ACCENTS = ["bg-brand-400", "bg-gold-400", "bg-slate-400", "bg-brand-600", "bg-gold-500", "bg-slate-500"];

const REST_SHADOW = "0 3px 0 0 rgba(15,23,42,0.10), 0 10px 22px -16px rgba(15,23,42,0.45)";
const LIFTED_SHADOW = "0 12px 26px -12px rgba(15,23,42,0.45), 0 4px 0 0 rgba(15,23,42,0.10)";

function withAlpha(color: string, alpha: string) {
  return color.length === 7 ? `${color}${alpha}` : color;
}

export function legoTone(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 9973;
  }
  const slot = Math.abs(hash) % TONES.length;
  return { card: TONES[slot], accent: ACCENTS[slot] };
}

export function LegoSurface({
  seed,
  selected,
  muted,
  snapping,
  color,
  className,
  children,
}: {
  seed: string;
  selected?: boolean;
  muted?: boolean;
  snapping?: boolean;
  color?: string | null;
  className?: string;
  children: ReactNode;
}) {
  const tone = legoTone(seed);
  const surfaceStyle = color
    ? {
        boxShadow: snapping ? LIFTED_SHADOW : REST_SHADOW,
        borderColor: withAlpha(color, "66"),
        backgroundColor: withAlpha(color, "14"),
      }
    : { boxShadow: snapping ? LIFTED_SHADOW : REST_SHADOW };
  return (
    <div
      style={surfaceStyle}
      className={cn(
        "relative overflow-hidden rounded-2xl border-2 transition-all duration-200",
        tone.card,
        selected ? "ring-2 ring-brand-500 ring-offset-1" : "",
        snapping ? "-translate-y-1 scale-[1.03]" : "hover:-translate-y-0.5",
        muted ? "opacity-60" : "",
        className,
      )}
    >
      <span
        className={cn("absolute inset-x-0 top-0 h-1", color ? "" : tone.accent)}
        style={color ? { backgroundColor: color } : undefined}
      />
      <span className="absolute right-2 top-2 flex gap-1">
        <span className="size-1.5 rounded-full bg-white shadow-sm ring-1 ring-black/5" />
        <span className="size-1.5 rounded-full bg-white shadow-sm ring-1 ring-black/5" />
      </span>
      {children}
    </div>
  );
}
