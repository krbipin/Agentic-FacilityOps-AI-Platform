"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Icon, type IconName } from "./icons";
import { cn } from "./cn";

type ToastTone = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const toneStyles: Record<ToastTone, { icon: IconName; ring: string }> = {
  success: { icon: "check", ring: "border-signal-green/40 text-signal-green" },
  error: { icon: "alert", ring: "border-alert-red/40 text-alert-red" },
  warning: { icon: "alert", ring: "border-alert-amber/40 text-alert-amber" },
  info: { icon: "info", ring: "border-primary/40 text-primary" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, tone: ToastTone = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-3), { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-full max-w-sm flex-col gap-2"
      >
        {toasts.map((t) => {
          const style = toneStyles[t.tone];
          return (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-card border bg-elevated-slate px-4 py-3 shadow-panel",
                style.ring,
              )}
            >
              <Icon name={style.icon} size={16} className="mt-0.5 shrink-0" />
              <p className="font-body-sm text-body-sm text-ice-white">{t.message}</p>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
