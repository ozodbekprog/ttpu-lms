import { cn } from "@/lib/utils";

export type RingTone = "green" | "amber" | "rose" | "slate";

export function ringTone(percent: number | null): RingTone {
  if (percent == null) return "slate";
  if (percent >= 80) return "green";
  if (percent >= 60) return "amber";
  return "rose";
}

const RING_STYLES: Record<RingTone, { stroke: string; track: string; text: string; glow: string }> = {
  green: {
    stroke: "stroke-emerald-500",
    track: "stroke-emerald-100",
    text: "text-emerald-600",
    glow: "from-emerald-400/20",
  },
  amber: {
    stroke: "stroke-amber-500",
    track: "stroke-amber-100",
    text: "text-amber-600",
    glow: "from-amber-400/20",
  },
  rose: {
    stroke: "stroke-rose-500",
    track: "stroke-rose-100",
    text: "text-rose-600",
    glow: "from-rose-400/20",
  },
  slate: {
    stroke: "stroke-slate-300",
    track: "stroke-slate-100",
    text: "text-slate-400",
    glow: "from-slate-300/20",
  },
};

export function percentOf(score: number | null | undefined, max: number): number | null {
  if (score == null || max <= 0) return null;
  return Math.round((score / max) * 100);
}

export function ScoreRing({
  score,
  max,
  size = 92,
  strokeWidth = 8,
  caption,
  hint,
  className,
}: {
  score: number | null | undefined;
  max: number;
  size?: number;
  strokeWidth?: number;
  caption?: string;
  hint?: string;
  className?: string;
}) {
  const percent = percentOf(score, max);
  const tone = RING_STYLES[ringTone(percent)];
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = percent != null ? (Math.min(100, Math.max(0, percent)) / 100) * circumference : 0;
  const percentClass = size >= 140 ? "text-3xl" : size >= 100 ? "text-2xl" : "text-xl";
  const scoreClass = size >= 140 ? "text-xs" : "text-[11px]";

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <div
          className={cn(
            "absolute inset-1 rounded-full bg-gradient-to-b to-transparent opacity-70",
            tone.glow,
          )}
        />
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className={cn("fill-none", tone.track)}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            className={cn("fill-none transition-all duration-700", tone.stroke)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-semibold tabular-nums", percentClass, tone.text)}>
            {percent != null ? `${percent}%` : "—"}
          </span>
          <span className={cn("font-medium text-slate-400", scoreClass)}>
            {score != null ? `${score}/${max}` : "ball yo'q"}
          </span>
        </div>
      </div>
      {caption ? (
        <span className="text-xs font-medium text-slate-500">{caption}</span>
      ) : null}
      {hint ? <span className="text-[11px] text-slate-400">{hint}</span> : null}
    </div>
  );
}
