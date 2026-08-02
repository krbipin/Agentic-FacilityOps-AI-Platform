import { cn } from "@/components/ui/cn";

interface DonutProps {
  segments: { label: string; value: number; color: string }[];
  centerValue?: string;
  centerLabel?: string;
  size?: number;
  thickness?: number;
  className?: string;
  centerScale?: number;
}

export function Donut({
  segments,
  centerValue,
  centerLabel,
  size = 160,
  thickness = 18,
  className,
  centerScale,
}: DonutProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const offsets = segments.map((_, idx) => segments.slice(0, idx).reduce((sum, s) => sum + s.value, 0));
  const responsive = centerScale !== undefined;

  return (
    <div className={cn("relative inline-flex items-center justify-center", responsive && "@container", className)}>
      <svg
        width={responsive ? "100%" : size}
        height={responsive ? "100%" : size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={segments.map((s) => `${s.label} ${s.value}`).join(", ")}
        className={responsive ? "block aspect-square" : undefined}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-elevated-slate)"
          strokeWidth={thickness}
        />
        {segments.map((s, idx) => {
          const len = (s.value / total) * circumference;
          const dash = `${len} ${circumference - len}`;
          const rotate = (offsets[idx] / total) * 360;
          return (
            <circle
              key={s.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={dash}
              transform={`rotate(${rotate} ${size / 2} ${size / 2})`}
            />
          );
        })}
      </svg>
      {centerValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-1 text-center">
          <span
            className={cn(
              "font-kpi-value leading-tight text-ice-white max-w-full truncate",
              !responsive && "text-kpi-value max-md:text-kpi-value-mobile",
            )}
            style={responsive ? { fontSize: `${centerScale * 100}cqw`, lineHeight: 1.1 } : undefined}
          >
            {centerValue}
          </span>
          {centerLabel && (
            <span
              className={cn("font-caption text-steel-slate", !responsive && "text-caption")}
              style={responsive ? { fontSize: `${centerScale * 45}cqw`, lineHeight: 1.2 } : undefined}
            >
              {centerLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface LegendItem {
  label: string;
  value: string;
  color: string;
  pct?: number;
}

export function DonutLegend({ items }: { items: LegendItem[] }) {
  return (
    <ul role="list" className="space-y-2.5">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-2.5 text-body-sm">
          <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: it.color }} />
          <span className="min-w-0 truncate text-steel-slate">{it.label}</span>
          {it.pct !== undefined && <span className="font-mono text-caption text-steel-slate shrink-0">{it.pct}%</span>}
          <span className="ml-auto shrink-0 font-mono text-body-sm text-ice-white">{it.value}</span>
        </li>
      ))}
    </ul>
  );
}
