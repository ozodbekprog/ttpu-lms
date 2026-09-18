import { cn } from "@/lib/utils";

const SIZE = 200;
const CENTER = SIZE / 2;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2 - 4;

function polar(angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return {
    x: CENTER + RADIUS * Math.cos(rad),
    y: CENTER + RADIUS * Math.sin(rad),
  };
}

export function gpaRingTone(gpa: number, dark = false) {
  if (gpa >= 3.5) return dark ? "text-emerald-400" : "text-emerald-500";
  if (gpa >= 3.0) return dark ? "text-brand-400" : "text-brand-500";
  if (gpa >= 2.5) return dark ? "text-gold-400" : "text-gold-500";
  if (gpa >= 2.0) return dark ? "text-amber-400" : "text-amber-500";
  return dark ? "text-rose-400" : "text-rose-500";
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
  const ratio = Math.min(Math.max(gpa / 4, 0), 0.9999);
  const start = polar(0);
  const end = polar(ratio * 360);
  const arc = `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${ratio > 0.5 ? 1 : 0} 1 ${end.x} ${end.y}`;
  const dark = variant === "dark";

  return (
    <div
      className={cn(
        "relative inline-flex size-48 shrink-0 items-center justify-center",
        className,
      )}
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 size-full">
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className={dark ? "stroke-white/15" : "stroke-slate-100"}
        />
        <path
          d={arc}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          className={cn("animate-draw", gpaRingTone(gpa, dark))}
          stroke="currentColor"
        />
      </svg>
      <span
        className={cn(
          "absolute inset-6 rounded-full",
          dark ? "bg-white/5" : "bg-slate-50/70",
        )}
      />
      <div className="relative flex flex-col items-center">
        <span
          className={cn(
            "text-5xl font-semibold tracking-tight tabular-nums",
            dark ? "text-white" : "text-brand-950",
          )}
        >
          {gpa.toFixed(2)}
        </span>
        <span
          className={cn(
            "mt-1 text-xs font-semibold uppercase tracking-[0.18em]",
            dark ? "text-brand-200" : "text-slate-400",
          )}
        >
          4.0 tizim
        </span>
      </div>
    </div>
  );
}
