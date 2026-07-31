"use client";

import { useId, type InputHTMLAttributes, type SelectHTMLAttributes } from "react";
import { Icon } from "./icons";
import { cn } from "./cn";

export function TextField({
  label,
  error,
  hint,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="font-label-caps text-label-caps text-steel-slate uppercase tracking-wide">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        className={cn(
          "h-10 w-full rounded-control border bg-abyss-navy px-3 font-body-md text-body-md text-ice-white placeholder:text-steel-slate/50 transition-colors focus:outline focus:outline-2 focus:outline-primary focus:outline-offset-0",
          error
            ? "border-alert-red/60 focus:outline-alert-red"
            : "border-hairline-slate hover:border-steel-slate/40",
        )}
        {...props}
      />
      {error ? (
        <p className="font-caption text-caption text-alert-red">{error}</p>
      ) : hint ? (
        <p className="font-caption text-caption text-steel-slate/70">{hint}</p>
      ) : null}
    </div>
  );
}

export function SelectField({
  label,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="font-label-caps text-label-caps text-steel-slate uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          className="h-10 w-full appearance-none rounded-control border border-hairline-slate bg-abyss-navy px-3 pr-9 font-body-md text-body-md text-ice-white transition-colors hover:border-steel-slate/40 focus:outline focus:outline-2 focus:outline-primary"
          {...props}
        >
          {children}
        </select>
        <Icon
          name="chevronDown"
          size={14}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-steel-slate"
        />
      </div>
    </div>
  );
}
