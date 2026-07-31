"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "./icons";
import { cn } from "./cn";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 sm:p-6",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      <div
        className={cn(
          "absolute inset-0 bg-abyss-navy/70 backdrop-blur-sm transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative w-full max-w-lg rounded-card bg-panel-slate glow-border shadow-panel transition-all duration-200",
          open ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-[0.98]",
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-hairline-slate px-6 py-4">
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-ice-white">
            {title}
          </h2>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-control p-1.5 text-steel-slate transition-colors hover:bg-hairline-slate/50 hover:text-ice-white"
          >
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="max-h-[70dvh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-hairline-slate px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
