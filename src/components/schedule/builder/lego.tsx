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
  className,
  children,
}: {
  seed: string;
  selected?: boolean;
  muted?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const tone = legoTone(seed);
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border-2 shadow-sm transition-all duration-150",
        tone.card,
        selected ? "ring-2 ring-brand-500 ring-offset-1" : "",
        muted ? "opacity-60" : "",
        className,
      )}
    >
      <span className={cn("absolute inset-x-0 top-0 h-1", tone.accent)} />
      <span className="absolute right-2 top-2 flex gap-1">
        <span className="size-1.5 rounded-full bg-white shadow-sm ring-1 ring-black/5" />
        <span className="size-1.5 rounded-full bg-white shadow-sm ring-1 ring-black/5" />
      </span>
      {children}
    </div>
  );
}
