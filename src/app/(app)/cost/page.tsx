import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const metadata: Metadata = { title: "Cost Optimization" };

export default function CostPage() {
  return (
    <PagePlaceholder
      title="Cost Optimization"
      subtitle="Monitored by the Cost Optimization Agent"
      phase="Phase 3"
      icon="dollar"
    />
  );
}
