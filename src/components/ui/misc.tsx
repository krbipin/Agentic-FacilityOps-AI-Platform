import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export function SectionHeader({
  title,
  right,
  className,
}: {
  title: string;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4 mb-4", className)}>
      <h2 className="font-section-header text-section-header text-steel-slate uppercase tracking-wider">
        {title}
      </h2>
      {right}
    </div>
  );
}

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("animate-pulse rounded-md bg-hairline-slate/60", className)}
      {...props}
    />
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 py-12 px-6 text-center",
        className,
      )}
    >
      {icon && <div className="text-steel-slate mb-1">{icon}</div>}
      <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-ice-white">
        {title}
      </h3>
      {body && <p className="max-w-sm font-body-sm text-body-sm text-steel-slate">{body}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
