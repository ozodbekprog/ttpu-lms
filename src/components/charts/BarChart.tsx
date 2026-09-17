export type BarChartDatum = { label: string; value: number };

const WIDTH = 560;

function niceScale(maxValue: number) {
  const max = Math.max(1, Math.ceil(maxValue));
  if (max <= 5) return { top: max, step: 1 };
  const rough = max / 4;
  const power = 10 ** Math.floor(Math.log10(rough));
  const normalized = rough / power;
  const step = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * power;
  return { top: Math.ceil(max / step) * step, step };
}

export function BarChart({ data, height = 220 }: { data: BarChartDatum[]; height?: number }) {
  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-slate-400">{"Ma'lumot yo'q"}</p>;
  }

  const pad = { top: 20, right: 10, bottom: 32, left: 40 };
  const innerWidth = WIDTH - pad.left - pad.right;
  const innerHeight = height - pad.top - pad.bottom;
  const { top, step } = niceScale(Math.max(...data.map((item) => item.value)));

  const ticks: number[] = [];
  for (let value = 0; value <= top; value += step) ticks.push(value);

  const slot = innerWidth / data.length;
  const barWidth = Math.min(46, slot * 0.6);
  const labelFont = data.length > 10 ? 9 : 10.5;

  const yFor = (value: number) => pad.top + innerHeight - (value / top) * innerHeight;

  return (
    <svg viewBox={`0 0 ${WIDTH} ${height}`} className="h-auto w-full" role="img">
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={pad.left}
            x2={WIDTH - pad.right}
            y1={yFor(tick)}
            y2={yFor(tick)}
            className="stroke-slate-200"
            strokeWidth={1}
          />
          <text
            x={pad.left - 8}
            y={yFor(tick) + 3}
            textAnchor="end"
            className="fill-slate-400"
            fontSize={9}
          >
            {tick}
          </text>
        </g>
      ))}

      <line
        x1={pad.left}
        x2={WIDTH - pad.right}
        y1={pad.top + innerHeight}
        y2={pad.top + innerHeight}
        className="stroke-slate-300"
        strokeWidth={1}
      />

      {data.map((item, index) => {
        const x = pad.left + slot * index + (slot - barWidth) / 2;
        const valueY = yFor(item.value);
        const barHeight = Math.max(item.value > 0 ? 2 : 0, pad.top + innerHeight - valueY);
        const centerX = x + barWidth / 2;
        return (
          <g key={`${item.label}-${index}`}>
            <rect
              x={x}
              y={pad.top + innerHeight - barHeight}
              width={barWidth}
              height={barHeight}
              rx={5}
              className="fill-brand-900"
            >
              <title>{`${item.label}: ${item.value}`}</title>
            </rect>
            <text x={centerX} y={valueY - 6} textAnchor="middle" className="fill-slate-500" fontSize={10}>
              {item.value}
            </text>
            <text
              x={centerX}
              y={height - 10}
              textAnchor="middle"
              className="fill-slate-400"
              fontSize={labelFont}
            >
              {item.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
