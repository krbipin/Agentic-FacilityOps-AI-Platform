"use client";

import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";
import { cn } from "./cn";

type DeltaTone = "green" | "red" | "amber" | "steel";

const deltaStyles: Record<DeltaTone, string> = {
  green: "text-signal-green",
  red: "text-alert-red",
  amber: "text-alert-amber",
  steel: "text-steel-slate",
};

export function KpiCard({
  label,
  value,
  icon,
  delta,
  deltaTone = "steel",
  sub,
  valueTone = "ice",
}: {
  label: string;
  value: ReactNode;
  icon?: IconName;
  delta?: ReactNode;
  deltaTone?: DeltaTone;
  sub?: ReactNode;
  valueTone?: "ice" | "green" | "red" | "amber" | "primary" | "violet";
}) {
  const valueColors: Record<string, string> = {
    ice: "text-ice-white",
    green: "text-signal-green",
    red: "text-alert-red",
    amber: "text-alert-amber",
    primary: "text-primary",
    violet: "text-violet",
  };

  return (
    <div className="rounded-card bg-panel-slate glow-border panel-glow flex flex-col justify-between gap-3 p-card-padding">
      <div className="flex items-center justify-between gap-3">
        <span className="font-label-caps text-label-caps text-steel-slate uppercase tracking-wide">
          {label}
        </span>
        {icon && <Icon name={icon} size={18} className="text-steel-slate shrink-0" />}
      </div>
      <div className="min-w-0">
        <div
          className={cn(
            "font-kpi-value text-kpi-value max-md:text-kpi-value-mobile leading-tight truncate",
            valueColors[valueTone],
          )}
        >
          {value}
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 font-caption text-caption">
          {delta && (
            <span
              className={cn(
                "inline-flex items-center gap-1 font-medium",
                deltaStyles[deltaTone],
              )}
            >
              {delta}
            </span>
          )}
          {sub && <span className="text-steel-slate truncate">{sub}</span>}
        </div>
      </div>
    </div>
  );
}
