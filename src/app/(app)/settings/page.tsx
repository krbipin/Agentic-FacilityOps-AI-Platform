import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <PagePlaceholder
      title="Settings & Integrations"
      subtitle="Notifications, agents, facilities, integrations, and team access"
      phase="Phase 5"
      icon="settings"
    />
  );
}
