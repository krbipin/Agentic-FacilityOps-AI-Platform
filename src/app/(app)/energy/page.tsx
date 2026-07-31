import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const metadata: Metadata = { title: "Energy" };

export default function EnergyPage() {
  return (
    <PagePlaceholder
      title="Energy Dashboard"
      subtitle="Monitored by the Energy Agent"
      phase="Phase 3"
      icon="bolt"
    />
  );
}
