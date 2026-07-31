import { cn } from "@/components/ui/cn";

interface BarItem {
  label: string;
  value: number;
  color?: string;
  display?: string;
}

interface BarsProps {
  data: BarItem[];
  horizontal?: boolean;
  height?: number;
  max?: number;
  className?: string;
}

export function Bars({ data, horizontal = false, height = 160, max, className }: BarsProps) {
  const cap = max ?? Math.max(...data.map((d) => d.value), 1);
  const color = "var(--color-primary)";

  if (horizontal) {
    return (
      <ul role="list" className={cn("space-y-3", className)}>
        {data.map((d) => (
          <li key={d.label} className="grid grid-cols-[88px_1fr_auto] items-center gap-3 text-body-sm">
            <span className="truncate text-steel-slate">{d.label}</span>
            <div className="relative h-6 overflow-hidden rounded-control bg-elevated-slate">
              <div
                className="h-full rounded-control"
                style={{ width: `${Math.min(100, (d.value / cap) * 100)}%`, background: d.color ?? color }}
                role="img"
                aria-label={`${d.label} ${d.value}`}
              />
            </div>
            <span className="w-16 text-right font-mono text-caption text-ice-white">{d.display ?? d.value}</span>
          </li>
        ))}
      </ul>
    );
  }

  const width = 480;
  const padBottom = 20;
  const n = data.length;
  const bw = Math.min(36, (width / n) * 0.5);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={cn("w-full", className)} role="img" aria-label="Bar chart">
      {[0, 0.5, 1].map((f) => (
        <line
          key={f}
          x1={0}
          x2={width}
          y1={f * (height - padBottom)}
          y2={f * (height - padBottom)}
          stroke="var(--color-hairline-slate)"
          strokeDasharray="4 4"
        />
      ))}
      {data.map((d, i) => {
        const h = (d.value / cap) * (height - padBottom);
        const cx = (i + 0.5) * (width / n);
        return (
          <g key={i}>
            <rect x={cx - bw / 2} y={height - padBottom - h} width={bw} height={h} rx={3} fill={d.color ?? color} />
            <text x={cx} y={height - 6} textAnchor="middle" fontSize={10} fill="var(--color-steel-slate)">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
