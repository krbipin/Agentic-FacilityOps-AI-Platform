import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const metadata: Metadata = { title: "Alerts" };

export default function AlertsPage() {
  return (
    <PagePlaceholder
      title="Alerts & Notifications"
      subtitle="Routing and automation by the Alert module"
      phase="Phase 4"
      icon="bell"
    />
  );
}
