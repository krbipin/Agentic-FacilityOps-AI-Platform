import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export type Tone = "green" | "blue" | "amber" | "red" | "violet" | "steel";

export const toneClasses: Record<Tone, string> = {
  green: "bg-signal-green/10 text-signal-green border-signal-green/25",
  blue: "bg-primary/10 text-primary border-primary/25",
  amber: "bg-alert-amber/10 text-alert-amber border-alert-amber/25",
  red: "bg-alert-red/10 text-alert-red border-alert-red/25",
  violet: "bg-violet/10 text-violet border-violet/25",
  steel: "bg-steel-slate/10 text-steel-slate border-steel-slate/25",
};

export function Chip({
  tone = "steel",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-label-caps text-label-caps tracking-wide uppercase",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
