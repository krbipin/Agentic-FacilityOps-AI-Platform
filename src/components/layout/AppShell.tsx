"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { cn } from "@/components/ui/cn";

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-dvh">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className={cn(
          "flex min-h-dvh flex-col transition-[padding] duration-300",
          collapsed ? "lg:pl-20" : "lg:pl-64",
        )}
      >
        <Topbar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          onOpenMobile={() => setMobileOpen(true)}
        />
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-gutter py-6">
          {children}
        </main>
        <footer className="border-t border-hairline-slate px-gutter py-3">
          <p className="font-caption text-caption text-steel-slate/70">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-signal-green" aria-hidden="true" />
              System operational
            </span>
            <span className="mx-2 text-hairline-slate">·</span>
            Data synced just now
          </p>
        </footer>
      </div>
    </div>
  );
}
