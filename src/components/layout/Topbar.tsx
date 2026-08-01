"use client";

import { useEffect, useRef, useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icons";
import { cn } from "@/components/ui/cn";

const FACILITY = "Corporate HQ & IT Park";

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

function Clock() {
  const now = useClock();
  const time = now.toLocaleTimeString("en-GB", { hour12: false });
  const date = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return (
    <div className="hidden md:flex flex-col items-end leading-tight">
      <span className="font-data-table text-data-table text-ice-white tabular-nums tracking-wide">
        {time}
      </span>
      <span className="font-caption text-caption text-steel-slate">{date}</span>
    </div>
  );
}

function Menu({
  trigger,
  children,
  align = "right",
}: {
  trigger: (open: boolean) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-control px-2 py-1.5 text-steel-slate transition-colors hover:bg-hairline-slate/50 hover:text-ice-white"
      >
        {trigger(open)}
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute top-full z-50 mt-2 min-w-56 rounded-card bg-elevated-slate glow-border panel-glow py-1.5",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onSelect,
  active,
}: {
  icon: Parameters<typeof Icon>[0]["name"];
  label: string;
  onSelect?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-2 font-body-sm text-body-sm transition-colors hover:bg-hairline-slate/50",
        active ? "text-primary" : "text-steel-slate",
      )}
    >
      <Icon name={icon} size={16} className="shrink-0" />
      {label}
    </button>
  );
}

export function Topbar({
  onOpenMobile,
  onToggleCollapse,
  collapsed,
}: {
  onOpenMobile: () => void;
  onToggleCollapse: () => void;
  collapsed: boolean;
}) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const displayName = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
    : "Facility Manager";
  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "FM";

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("theme");
    } catch {
      /* private mode */
    }
    const param = new URLSearchParams(window.location.search).get("__theme");
    if (param === "light" || param === "dark") saved = param;
    const id = window.setTimeout(() => {
      if (saved === "light") {
        setTheme("light");
        document.documentElement.classList.add("light");
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("light", next === "light");
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* private mode */
    }
  };

  const handleSignOut = () => {
    void signOut({ redirectUrl: "/" });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between gap-3 border-b border-hairline-slate bg-abyss-navy px-gutter">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenMobile}
          aria-label="Open navigation"
          className="rounded-control p-2 text-steel-slate hover:bg-hairline-slate/50 hover:text-ice-white lg:hidden"
        >
          <Icon name="menu" size={20} />
        </button>
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden rounded-control p-2 text-steel-slate hover:bg-hairline-slate/50 hover:text-ice-white lg:inline-flex"
        >
          <Icon name={collapsed ? "chevronRight" : "chevronLeft"} size={18} />
        </button>

        <Menu
          align="left"
          trigger={(open) => (
            <>
              <Icon name="building" size={18} />
              <span className="max-w-40 truncate font-body-sm text-body-sm font-medium text-ice-white">
                {FACILITY}
              </span>
              <Icon name="chevronDown" size={14} className={cn("transition-transform", open && "rotate-180")} />
            </>
          )}
        >
          {(close) => (
            <>
              <p className="px-4 pb-1.5 pt-1 font-label-caps text-label-caps text-steel-slate/60 uppercase">
                Facility
              </p>
              <MenuItem icon="building" label={FACILITY} active onSelect={close} />
              <MenuItem icon="plus" label="Add facility" onSelect={close} />
            </>
          )}
        </Menu>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <div className="mr-2 hidden items-center gap-2 rounded-full border border-hairline-slate bg-panel-slate px-2.5 py-1 sm:flex">
          <span className="size-1.5 rounded-full bg-signal-green animate-pulse-dot" aria-hidden="true" />
          <span className="font-label-caps text-label-caps text-signal-green uppercase">Live</span>
        </div>

        <Clock />

        <div className="mx-1 hidden h-6 w-px bg-hairline-slate sm:block" aria-hidden="true" />

        <button
          type="button"
          aria-label={`${4} unread alerts`}
          className="relative rounded-control p-2 text-steel-slate hover:bg-hairline-slate/50 hover:text-ice-white"
        >
          <Icon name="bell" size={20} />
          <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-alert-red px-1 font-data-table text-[10px] font-semibold text-ice-white">
            4
          </span>
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          className="rounded-control p-2 text-steel-slate hover:bg-hairline-slate/50 hover:text-ice-white"
        >
          <Icon name={theme === "dark" ? "sun" : "moon"} size={19} />
        </button>

        <div className="mx-1 hidden h-6 w-px bg-hairline-slate sm:block" aria-hidden="true" />

        <Menu
          trigger={(open) => (
            <>
              <span className="flex size-8 items-center justify-center rounded-full bg-primary/15 font-data-table text-xs font-semibold text-primary ring-1 ring-primary/30">
                {initials}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block max-w-32 truncate font-body-sm text-body-sm font-medium leading-tight text-ice-white">
                  {isLoaded ? displayName : "…"}
                </span>
                <span className="block font-caption text-caption leading-tight text-steel-slate">
                  Facility Manager
                </span>
              </span>
              <Icon name="chevronDown" size={14} className={cn("transition-transform", open && "rotate-180")} />
            </>
          )}
        >
          {() => (
            <>
              <p className="px-4 pb-1.5 pt-1 font-label-caps text-label-caps text-steel-slate/60 uppercase">
                {isLoaded ? displayName : "Account"}
              </p>
              <MenuItem icon="users" label="Profile" onSelect={() => router.push("/user")} />
              <MenuItem icon="settings" label="Settings" onSelect={() => router.push("/settings")} />
              <MenuItem icon="fileText" label="My reports" onSelect={() => router.push("/reports")} />
              <div className="my-1.5 h-px bg-hairline-slate" aria-hidden="true" />
              <MenuItem icon="logout" label="Sign out" onSelect={handleSignOut} />
            </>
          )}
        </Menu>
      </div>
    </header>
  );
}
