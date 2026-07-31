import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export function Card({
  className,
  hover = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-card bg-panel-slate glow-border panel-glow",
        hover && "transition-colors hover:bg-elevated-slate",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  subtitle,
  right,
  className,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-4", className)}>
      <div className="min-w-0">
        <h3 className="font-section-header text-section-header text-steel-slate uppercase tracking-wider">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-1 font-caption text-caption text-steel-slate/70">
            {subtitle}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}
