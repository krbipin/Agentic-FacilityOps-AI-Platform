import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const metadata: Metadata = { title: "Maintenance" };

export default function MaintenancePage() {
  return (
    <PagePlaceholder
      title="Maintenance Dashboard"
      subtitle="Monitored by the Maintenance Agent"
      phase="Phase 3"
      icon="wrench"
    />
  );
}
