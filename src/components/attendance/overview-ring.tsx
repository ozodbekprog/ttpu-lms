import { cn } from "@/lib/utils";

const VIEW = 200;
const CENTER = VIEW / 2;
const RADIUS = 86;
const STROKE = 16;
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
      <svg
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        className="h-44 w-44 sm:h-48 sm:w-48"
        role="img"
        aria-label={`Davomat ${value}%`}
      >
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
            className="stroke-brand-600"
          />
        ) : null}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-semibold tracking-tight tabular-nums text-brand-950">
          {value}%
        </span>
        <span className="mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
          {caption}
        </span>
      </div>
    </div>
  );
}
