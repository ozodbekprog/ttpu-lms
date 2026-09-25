export type DonutChartDatum = { label: string; value: number; color: string };

const SIZE = 180;
const CENTER = SIZE / 2;
const RADIUS = 62;
const STROKE = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DonutChart({ data }: { data: DonutChartDatum[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (data.length === 0 || total === 0) {
    return <p className="py-12 text-center text-sm text-slate-600">{"Ma'lumot yo'q"}</p>;
  }

  const segments = data.reduce<
    { label: string; value: number; color: string; length: number; offset: number }[]
  >((accumulator, item) => {
    const length = (item.value / total) * CIRCUMFERENCE;
    const previous = accumulator[accumulator.length - 1];
    const start = previous ? previous.offset + previous.length : 0;
    accumulator.push({ ...item, length, offset: start });
    return accumulator;
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-auto w-44 shrink-0" role="img">
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="animate-fade-in stroke-slate-100"
        />
        {segments.map((segment, segmentIndex) => {
          if (segment.value <= 0) return null;
          return (
            <circle
              key={segment.label}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={segment.color}
              strokeWidth={STROKE}
              strokeDasharray={`${segment.length} ${CIRCUMFERENCE - segment.length}`}
              strokeDashoffset={-segment.offset}
              transform={`rotate(-90 ${CENTER} ${CENTER})`}
              className="animate-fade-in"
              style={{ animationDelay: `${segmentIndex * 90}ms` }}
            >
              <title>{`${segment.label}: ${segment.value}`}</title>
            </circle>
          );
        })}
        <text
          x={CENTER}
          y={CENTER - 2}
          textAnchor="middle"
          className="animate-fade-in fill-brand-950"
          fontSize={26}
          fontWeight={600}
          style={{ animationDelay: "220ms" }}
        >
          {total}
        </text>
        <text
          x={CENTER}
          y={CENTER + 16}
          textAnchor="middle"
          className="animate-fade-in fill-slate-400"
          fontSize={10}
          style={{ animationDelay: "220ms" }}
        >
          jami
        </text>
      </svg>

      <ul className="flex w-full max-w-56 flex-col gap-2.5">
        {data.map((item, index) => {
          const percent = Math.round((item.value / total) * 100);
          return (
            <li
              key={item.label}
              className="flex animate-fade-in items-center gap-2.5"
              style={{ animationDelay: `${280 + index * 60}ms` }}
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="min-w-0 flex-1 truncate text-sm text-slate-600">{item.label}</span>
              <span className="text-sm font-semibold text-slate-900">{item.value}</span>
              <span className="w-9 text-right text-xs text-slate-600">{percent}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
