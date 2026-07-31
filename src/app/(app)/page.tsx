import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const metadata: Metadata = { title: "Facility Operations" };

export default function OverviewPage() {
  return (
    <PagePlaceholder
      title="Facility Operations"
      subtitle="Command center for all facility domains"
      phase="Phase 3"
      icon="grid"
    />
  );
}
