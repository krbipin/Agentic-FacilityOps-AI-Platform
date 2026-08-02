import { cn } from "@/components/ui/cn";

interface AreaPoint {
  label: string;
  value: number;
}

interface AreaChartProps {
  data: AreaPoint[];
  secondary?: { data: AreaPoint[]; color?: string };
  height?: number;
  color?: string;
  fill?: string;
  showGrid?: boolean;
  className?: string;
  pointLabel?: (p: AreaPoint) => string;
  highlight?: (p: AreaPoint) => boolean;
  labelEvery?: number;
  secondaryLabelEvery?: number;
}

export function AreaChart({
  data,
  secondary,
  height = 180,
  color = "var(--color-primary)",
  fill = "var(--color-primary)",
  showGrid = true,
  className,
  pointLabel,
  highlight,
  labelEvery = 1,
  secondaryLabelEvery = 1,
}: AreaChartProps) {
  const width = 600;
  const padX = 4;
  const padTop = 12;
  const padBottom = 20;
  const allValues = [...data, ...(secondary?.data ?? [])].map((d) => d.value);
  const max = Math.max(...allValues, 1) * 1.1;
  const min = Math.min(0, ...allValues);
  const range = max - min || 1;

  const x = (i: number) => padX + (i / Math.max(data.length - 1, 1)) * (width - padX * 2);
  const y = (v: number) => padTop + (1 - (v - min) / range) * (height - padTop - padBottom);

  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1).toFixed(1)},${height - padBottom} L${x(0).toFixed(1)},${height - padBottom} Z`;

  const sec = secondary?.data ?? [];
  const secX = (i: number) => padX + ((data.length + i) / Math.max(data.length + sec.length - 1, 1)) * (width - padX * 2);
  const secLine = sec.map((d, i) => `${i === 0 ? "M" : "L"}${secX(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const secColor = secondary?.color ?? "var(--color-violet)";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={cn("w-full", className)} role="img" aria-label="Line chart">
      <defs>
        <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.28" />
          <stop offset="100%" stopColor={fill} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {showGrid &&
        [0, 0.5, 1].map((f) => (
          <line
            key={f}
            x1={padX}
            x2={width - padX}
            y1={padTop + f * (height - padTop - padBottom)}
            y2={padTop + f * (height - padTop - padBottom)}
            stroke="var(--color-hairline-slate)"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
        ))}
      <path d={area} fill="url(#area-fill)" />
      <path d={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {secLine && <path d={secLine} fill="none" stroke={secColor} strokeWidth={2} strokeDasharray="5 4" strokeLinejoin="round" strokeLinecap="round" />}
      {sec.map((d, i) =>
        i % secondaryLabelEvery === 0 ? (
          <text key={`sec-${i}`} x={secX(i)} y={height - 5} textAnchor="middle" fontSize={10} fill="var(--color-violet)">
            {d.label}
          </text>
        ) : null,
      )}
      {data.map((d, i) => {
        const hl = highlight?.(d);
        const showLabel = i % labelEvery === 0;
        return (
          <g key={i}>
            <circle cx={x(i)} cy={y(d.value)} r={hl ? 4 : 0} fill={color} />
            {showLabel && (
              <text x={x(i)} y={height - 5} textAnchor="middle" fontSize={10} fill="var(--color-steel-slate)">
                {d.label}
              </text>
            )}
            {hl && showLabel && (
              <text x={x(i)} y={y(d.value) - 10} textAnchor="middle" fontSize={10} fill={color} fontWeight={700}>
                {pointLabel ? pointLabel(d) : d.value}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
