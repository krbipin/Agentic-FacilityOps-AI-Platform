import { cn } from "@/components/ui/cn";

interface GaugeProps {
  value: number;
  max?: number;
  label?: string;
  color?: string;
  size?: number;
  className?: string;
}

export function Gauge({ value, max = 100, label, color, size = 120, className }: GaugeProps) {
  const pct = Math.min(value / max, 1);
  const startAngle = 180;
  const endAngle = 360;
  const sweep = (endAngle - startAngle) * pct;
  const stroke = color ?? (pct > 0.75 ? "var(--color-signal-green)" : pct > 0.5 ? "var(--color-alert-amber)" : "var(--color-alert-red)");
  const r = (size - 16) / 2;

  const polar = (angle: number, radius: number) => {
    const rad = (angle * Math.PI) / 180;
    return [size / 2 + radius * Math.cos(rad), size / 2 + radius * Math.sin(rad)];
  };
  const [sx, sy] = polar(startAngle, r);
  const [ex, ey] = polar(startAngle + sweep, r);
  const largeArc = sweep > 180 ? 1 : 0;

  const arcPath =
    sweep <= 0
      ? ""
      : `M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${r} ${r} 0 ${largeArc} 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} role="img" aria-label={`${label ?? "Score"} ${value}`}>
      <svg width={size} height={size / 2 + 8} viewBox={`0 0 ${size} ${size / 2 + 8}`}>
        <path
          d={`M ${polar(startAngle, r)[0].toFixed(1)} ${polar(startAngle, r)[1].toFixed(1)} A ${r} ${r} 0 0 1 ${polar(180, r)[0].toFixed(1)} ${polar(180, r)[1].toFixed(1)}`}
          fill="none"
          stroke="var(--color-elevated-slate)"
          strokeWidth={12}
          strokeLinecap="round"
        />
        {arcPath && <path d={arcPath} fill="none" stroke={stroke} strokeWidth={12} strokeLinecap="round" />}
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
        <span className="font-kpi-value text-[22px] leading-none text-ice-white">{Math.round(value)}</span>
        {label && <span className="text-caption text-steel-slate">{label}</span>}
      </div>
    </div>
  );
}
