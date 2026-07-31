"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_SECTIONS } from "@/lib/nav";
import { Icon } from "@/components/ui/icons";
import { cn } from "@/components/ui/cn";

function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" className="shrink-0">
      <polygon
        points="16,2 28,9 28,23 16,30 4,23 4,9"
        fill="none"
        stroke="#38BDF8"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <text
        x="16"
        y="21.5"
        textAnchor="middle"
        fontSize="15"
        fontWeight="700"
        fill="#38BDF8"
        fontFamily="Inter, sans-serif"
      >
        F
      </text>
    </svg>
  );
}

export function Sidebar({
  collapsed,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const nav = (
    <>
      <div className="flex h-16 shrink-0 items-center gap-2.5 px-5 border-b border-hairline-slate">
        <BrandMark />
        <div className={cn("min-w-0 overflow-hidden transition-opacity", collapsed ? "lg:opacity-0" : "opacity-100")}>
          <p className="truncate font-headline-lg-mobile text-headline-lg-mobile text-ice-white leading-tight">
            FacilityOps AI
          </p>
          <p className="truncate font-caption text-caption text-steel-slate">
            Operations Command
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto no-scrollbar py-4 px-3" aria-label="Main navigation">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-5">
            <p
              className={cn(
                "px-3 pb-2 font-label-caps text-label-caps text-steel-slate/60 uppercase tracking-wider",
                collapsed && "lg:hidden",
              )}
            >
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onCloseMobile}
                      aria-current={active ? "page" : undefined}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-control px-3 py-2.5 font-body-sm text-body-sm transition-colors",
                        active
                          ? "bg-primary/10 text-primary border-r-2 border-primary font-medium"
                          : "text-steel-slate hover:bg-hairline-slate/50 hover:text-ice-white",
                        collapsed && "lg:justify-center lg:px-2",
                      )}
                    >
                      <Icon name={item.icon} size={18} className="shrink-0" />
                      <span className={cn("truncate", collapsed && "lg:hidden")}>
                        {item.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-hairline-slate px-5 py-3">
        <div className={cn("flex items-center justify-between", collapsed && "lg:flex-col lg:gap-1")}>
          <span className="flex items-center gap-2 font-caption text-caption text-steel-slate">
            <span className="size-1.5 rounded-full bg-signal-green animate-pulse-dot" aria-hidden="true" />
            All agents online
          </span>
          <span className={cn("font-data-table text-data-table text-steel-slate/70", collapsed && "lg:text-[10px]")}>
            v2.4.0
          </span>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop rail */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col bg-panel-slate border-r border-hairline-slate transition-[width] duration-300 lg:flex",
          collapsed ? "w-20" : "w-64",
        )}
      >
        {nav}
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn("fixed inset-0 z-50 lg:hidden", mobileOpen ? "pointer-events-auto" : "pointer-events-none")}
        aria-hidden={!mobileOpen}
      >
        <div
          className={cn(
            "absolute inset-0 bg-abyss-navy/70 backdrop-blur-sm transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={onCloseMobile}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 flex w-64 flex-col bg-panel-slate border-r border-hairline-slate shadow-panel transition-transform duration-300",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {nav}
        </aside>
      </div>
    </>
  );
}
