import { cn } from "@/lib/utils";

const VIEW = 220;
const CENTER = VIEW / 2;
const RADIUS = 92;
const STROKE = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function AttendanceRing({
  percent,
  caption = "davomat",
  className,
}: {
  percent: number;
  caption?: string;
  className?: string;
}) {
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  const filled = (value / 100) * CIRCUMFERENCE;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <span className="pointer-events-none absolute inset-4 rounded-full bg-gradient-to-br from-brand-400/15 via-brand-300/10 to-gold-400/15 blur-2xl" />
      <svg
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        className="relative h-48 w-48 sm:h-56 sm:w-56"
        role="img"
        aria-label={`Davomat ${value}%`}
      >
        <defs>
          <linearGradient id="attendance-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3f5a9d" />
            <stop offset="55%" stopColor="#5373b8" />
            <stop offset="100%" stopColor="#d4af37" />
          </linearGradient>
        </defs>
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-slate-100"
        />
        {value > 0 ? (
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap={value >= 100 ? "butt" : "round"}
            strokeDasharray={`${filled} ${CIRCUMFERENCE - filled}`}
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
            stroke="url(#attendance-ring-gradient)"
            className="drop-shadow-[0_3px_8px_rgba(63,90,157,0.35)]"
          />
        ) : null}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS - STROKE - 7}
          fill="none"
          strokeWidth={1}
          strokeDasharray="1 7"
          className="stroke-slate-200"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="bg-gradient-to-br from-brand-900 to-brand-700 bg-clip-text text-5xl font-semibold tracking-tight tabular-nums text-transparent sm:text-6xl">
          {value}%
        </span>
        <span className="mt-2 text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">
          {caption}
        </span>
      </div>
    </div>
  );
}
