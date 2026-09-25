export type LineChartDatum = { label: string; value: number };

const WIDTH = 560;
const HEIGHT = 230;
const PAD = { top: 18, right: 20, bottom: 30, left: 38 };

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function smoothPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[Math.max(0, index - 1)];
    const current = points[index];
    const next = points[index + 1];
    const after = points[Math.min(points.length - 1, index + 2)];
    const c1x = current.x + (next.x - previous.x) / 6;
    const c1y = current.y + (next.y - previous.y) / 6;
    const c2x = next.x - (after.x - current.x) / 6;
    const c2y = next.y - (after.y - current.y) / 6;
    path += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${next.x} ${next.y}`;
  }
  return path;
}

export function LineChart({ data }: { data: LineChartDatum[] }) {
  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-slate-600">{"Ma'lumot yo'q"}</p>;
  }

  const innerWidth = WIDTH - PAD.left - PAD.right;
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;
  const baseY = PAD.top + innerHeight;
  const denominator = Math.max(1, data.length - 1);

  const yFor = (value: number) => PAD.top + innerHeight - (clamp(value) / 100) * innerHeight;

  const points = data.map((item, index) => ({
    x: data.length === 1 ? PAD.left + innerWidth / 2 : PAD.left + (innerWidth * index) / denominator,
    y: yFor(item.value),
    label: item.label,
    value: Math.round(item.value),
  }));

  const line = smoothPath(points);
  const area = `${line} L ${points[points.length - 1].x} ${baseY} L ${points[0].x} ${baseY} Z`;
  const labelInterval = Math.max(1, Math.ceil(data.length / 7));

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full" role="img">
      {[0, 25, 50, 75, 100].map((tick, tickIndex) => (
        <g key={tick}>
          <line
            x1={PAD.left}
            x2={WIDTH - PAD.right}
            y1={yFor(tick)}
            y2={yFor(tick)}
            className="animate-fade-in stroke-slate-200"
            strokeWidth={1}
            style={{ animationDelay: `${tickIndex * 60}ms` }}
          />
          <text
            x={PAD.left - 8}
            y={yFor(tick) + 3}
            textAnchor="end"
            className="animate-fade-in fill-slate-400"
            fontSize={9}
            style={{ animationDelay: `${tickIndex * 60}ms` }}
          >
            {tick}%
          </text>
        </g>
      ))}

      <path
        d={area}
        className="animate-fade-in fill-brand-100"
        fillOpacity={0.55}
        style={{ animationDelay: "150ms" }}
      />
      <path
        d={line}
        className="animate-draw stroke-brand-900"
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
      />

      {points.map((point, index) => {
        const isLast = index === points.length - 1;
        return (
          <g key={`${point.label}-${index}`}>
            {isLast ? (
              <circle
                cx={point.x}
                cy={point.y}
                r={9}
                className="animate-fade-in fill-gold-300"
                fillOpacity={0.25}
                style={{ animationDelay: `${index * 50}ms` }}
              />
            ) : null}
            <circle
              cx={point.x}
              cy={point.y}
              r={isLast ? 5 : 3.5}
              className={
                isLast
                  ? "animate-fade-in fill-gold-500 stroke-white"
                  : "animate-fade-in fill-white stroke-brand-700"
              }
              strokeWidth={2}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <title>{`${point.label}: ${point.value}%`}</title>
            </circle>
            {index % labelInterval === 0 || isLast ? (
              <text
                x={point.x}
                y={HEIGHT - 10}
                textAnchor="middle"
                className="fill-slate-400"
                fontSize={9.5}
              >
                {point.label}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
