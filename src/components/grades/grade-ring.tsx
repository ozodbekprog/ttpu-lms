import { cn } from "@/lib/utils";

const RING_TONES = {
  high: { from: "#34d399", to: "#059669", glow: "bg-emerald-400/25" },
  mid: { from: "#e3c76a", to: "#c9a227", glow: "bg-gold-300/35" },
  low: { from: "#fb7185", to: "#e11d48", glow: "bg-rose-400/25" },
  none: { from: "#cbd5e1", to: "#e2e8f0", glow: "bg-slate-200/40" },
};

export function GradeRing({
  percent,
  size = 168,
  id = "grade-ring-gradient",
  className,
}: {
  percent: number | null;
  size?: number;
  id?: string;
  className?: string;
}) {
  const value = percent == null ? 0 : Math.max(0, Math.min(100, percent));
  const tone =
    percent == null
      ? RING_TONES.none
      : value >= 80
        ? RING_TONES.high
        : value >= 60
          ? RING_TONES.mid
          : RING_TONES.low;
  const frac = value / 100;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <span className={cn("absolute inset-3 rounded-full blur-xl animate-pulse", tone.glow)} />
      <span className="absolute inset-0 rounded-full bg-gradient-to-br from-white/70 to-transparent" />
      <svg
        viewBox="0 0 120 120"
        className="relative size-full"
        role="img"
        aria-label={percent != null ? `O'rtacha ${percent}%` : "Baho yo'q"}
      >
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={tone.from} />
            <stop offset="100%" stopColor={tone.to} />
          </linearGradient>
        </defs>
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke="#eef2f7"
          strokeWidth="11"
          transform="rotate(-90 60 60)"
        />
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth="11"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1}
          transform="rotate(-90 60 60)"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="1"
            to={`${1 - frac}`}
            dur="1.3s"
            calcMode="spline"
            keyTimes="0;1"
            keySplines="0.22 1 0.36 1"
            fill="freeze"
          />
        </circle>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold tracking-tight text-brand-900 tabular-nums sm:text-4xl">
          {percent != null ? `${percent}%` : "—"}
        </span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          O&apos;rtacha
        </span>
      </div>
    </div>
  );
}
