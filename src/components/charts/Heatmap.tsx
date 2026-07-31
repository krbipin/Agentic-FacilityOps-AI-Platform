import { cn } from "@/components/ui/cn";

interface HeatmapCell {
  day: string;
  hour: number;
  value: number; // 0..1 utilization
}

interface HeatmapProps {
  cells: HeatmapCell[];
  days: string[];
  hours: number[];
  className?: string;
}

const HEAT_COLORS = ["var(--color-elevated-slate)", "var(--color-primary)", "var(--color-signal-green)", "var(--color-alert-amber)", "var(--color-alert-red)"];

export function Heatmap({ cells, days, hours, className }: HeatmapProps) {
  const cellW = 22;
  const cellH = 22;
  const gap = 4;
  const labelW = 26;
  const width = labelW + hours.length * (cellW + gap) + 8;
  const height = days.length * (cellH + gap) + 12;

  const colorFor = (v: number) => {
    if (v <= 0.25) return HEAT_COLORS[0];
    if (v <= 0.5) return HEAT_COLORS[1];
    if (v <= 0.75) return HEAT_COLORS[2];
    return v <= 0.9 ? HEAT_COLORS[3] : HEAT_COLORS[4];
  };

  const lookup = new Map<string, number>(cells.map((c) => [`${c.day}|${c.hour}`, c.value]));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={cn("max-w-full", className)} role="img" aria-label="Occupancy heatmap">
      {hours.map((h, i) => (
        <text key={h} x={labelW + i * (cellW + gap) + cellW / 2} y={10} textAnchor="middle" fontSize={9} fill="var(--color-steel-slate)">
          {h}
        </text>
      ))}
      {days.map((d, di) => (
        <g key={d}>
          <text x={labelW - 4} y={12 + di * (cellH + gap) + cellH / 2} textAnchor="end" fontSize={9} fill="var(--color-steel-slate)">
            {d}
          </text>
          {hours.map((h, hi) => {
            const cell = lookup.get(`${d}|${h}`);
            const v = cell ?? 0;
            return (
              <rect
                key={hi}
                x={labelW + hi * (cellW + gap)}
                y={8 + di * (cellH + gap)}
                width={cellW}
                height={cellH}
                rx={4}
                fill={colorFor(v)}
                opacity={v > 0.25 ? 0.85 : 0.5}
              />
            );
          })}
        </g>
      ))}
    </svg>
  );
}
