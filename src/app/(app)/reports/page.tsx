import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const metadata: Metadata = { title: "Executive Reporting" };

export default function ReportsPage() {
  return (
    <PagePlaceholder
      title="Executive Report"
      subtitle="Boardroom-ready summary · Q3 · Corporate HQ & IT Park"
      phase="Phase 4"
      icon="chart"
    />
  );
}
