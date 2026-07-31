import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const metadata: Metadata = { title: "Occupancy" };

export default function OccupancyPage() {
  return (
    <PagePlaceholder
      title="Occupancy Dashboard"
      subtitle="Monitored by the Occupancy Agent"
      phase="Phase 3"
      icon="users"
    />
  );
}
