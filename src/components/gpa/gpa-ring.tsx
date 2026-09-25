import { cn } from "@/lib/utils";

const SIZE = 220;
const CENTER = SIZE / 2;
const STROKE = 18;
const RADIUS = (SIZE - STROKE) / 2 - 6;
const TICKS = 8;

type GpaTier = "emerald" | "brand" | "gold" | "amber" | "rose";

const TIER_META: Record<
  GpaTier,
  { from: string; to: string; glow: string; halo: string }
> = {
  emerald: {
    from: "#6ee7b7",
    to: "#059669",
    glow: "drop-shadow-[0_0_14px_rgba(16,185,129,0.55)]",
    halo: "bg-emerald-400/10",
  },
  brand: {
    from: "#a3b8e0",
    to: "#2b3c68",
    glow: "drop-shadow-[0_0_14px_rgba(83,115,184,0.55)]",
    halo: "bg-brand-400/10",
  },
  gold: {
    from: "#f0d98a",
    to: "#a9871f",
    glow: "drop-shadow-[0_0_14px_rgba(212,175,55,0.55)]",
    halo: "bg-gold-300/20",
  },
  amber: {
    from: "#fcd34d",
    to: "#d97706",
    glow: "drop-shadow-[0_0_14px_rgba(245,158,11,0.55)]",
    halo: "bg-amber-400/10",
  },
  rose: {
    from: "#fda4af",
    to: "#e11d48",
    glow: "drop-shadow-[0_0_14px_rgba(244,63,94,0.55)]",
    halo: "bg-rose-400/10",
  },
};

export function gpaTier(gpa: number): GpaTier {
  if (gpa >= 3.5) return "emerald";
  if (gpa >= 3.0) return "brand";
  if (gpa >= 2.5) return "gold";
  if (gpa >= 2.0) return "amber";
  return "rose";
}

export function gpaRingTone(gpa: number, dark = false) {
  if (gpa >= 3.5) return dark ? "text-emerald-400" : "text-emerald-500";
  if (gpa >= 3.0) return dark ? "text-brand-400" : "text-brand-500";
  if (gpa >= 2.5) return dark ? "text-gold-400" : "text-gold-700";
  if (gpa >= 2.0) return dark ? "text-amber-400" : "text-amber-500";
  return dark ? "text-rose-400" : "text-rose-500";
}

function polar(angle: number, radius: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad),
  };
}

export function GpaRing({
  gpa,
  variant = "light",
  className,
}: {
  gpa: number;
  variant?: "light" | "dark";
  className?: string;
}) {
  const tier = gpaTier(gpa);
  const meta = TIER_META[tier];
  const ratio = Math.min(Math.max(gpa / 4, 0), 0.9999);
  const start = polar(0, RADIUS);
  const end = polar(ratio * 360, RADIUS);
  const arc = `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${ratio > 0.5 ? 1 : 0} 1 ${end.x} ${end.y}`;
  const dark = variant === "dark";
  const gradientId = `gpa-ring-${variant}-${tier}`;

  return (
    <div
      className={cn(
        "relative inline-flex size-52 shrink-0 items-center justify-center sm:size-60",
        className,
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute inset-4 animate-pulse rounded-full",
          meta.halo,
        )}
      />
      <span
        className={cn(
          "pointer-events-none absolute inset-1 rounded-full border",
          dark ? "border-white/5" : "border-slate-100",
        )}
      />
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="absolute inset-0 size-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={meta.from} />
            <stop offset="100%" stopColor={meta.to} />
          </linearGradient>
        </defs>
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className={dark ? "stroke-white/10" : "stroke-slate-100"}
        />
        {Array.from({ length: TICKS }, (_, index) => {
          const angle = (index * 360) / TICKS;
          const inner = polar(angle, RADIUS - STROKE / 2 - 4);
          const outer = polar(angle, RADIUS - STROKE / 2 - 11);
          return (
            <line
              key={angle}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              strokeWidth={2}
              strokeLinecap="round"
              className={dark ? "stroke-white/20" : "stroke-slate-200"}
            />
          );
        })}
        <path
          d={arc}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          stroke={`url(#${gradientId})`}
          className={cn("animate-draw", meta.glow)}
        />
      </svg>
      <span
        className={cn(
          "absolute inset-7 rounded-full",
          dark
            ? "bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            : "bg-slate-50/80",
        )}
      />
      <div className="relative flex flex-col items-center">
        <span
          className={cn(
            "text-5xl font-semibold leading-none tracking-tight tabular-nums sm:text-[3.4rem]",
            dark ? "text-white" : "text-brand-950",
          )}
        >
          {gpa.toFixed(2)}
        </span>
        <span
          className={cn(
            "mt-2 text-[11px] font-semibold uppercase tracking-[0.22em]",
            dark ? "text-brand-200" : "text-slate-600",
          )}
        >
          4.0 tizim
        </span>
      </div>
    </div>
  );
}
