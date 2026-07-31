import type { IconName } from "@/components/ui/icons";

export interface NavItem {
  label: string;
  href: string;
  icon: IconName;
}

export const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: "Operations",
    items: [
      { label: "Overview", href: "/", icon: "grid" },
      { label: "Energy", href: "/energy", icon: "bolt" },
      { label: "Maintenance", href: "/maintenance", icon: "wrench" },
      { label: "Occupancy", href: "/occupancy", icon: "users" },
      { label: "Security", href: "/security", icon: "shield" },
      { label: "Cost", href: "/cost", icon: "dollar" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "Intelligence", href: "/intelligence", icon: "brain" },
      { label: "Alerts", href: "/alerts", icon: "bell" },
      { label: "Reports", href: "/reports", icon: "chart" },
    ],
  },
  {
    label: "Manage",
    items: [
      { label: "Assets", href: "/assets", icon: "box" },
      { label: "Work Orders", href: "/work-orders", icon: "clipboard" },
      { label: "Copilot", href: "/copilot", icon: "sparkles" },
      { label: "Settings", href: "/settings", icon: "settings" },
    ],
  },
];
