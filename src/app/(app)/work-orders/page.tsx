import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const metadata: Metadata = { title: "Work Orders" };

export default function WorkOrdersPage() {
  return (
    <PagePlaceholder
      title="Work Orders"
      subtitle="89 tickets · 12 predicted failures flagged"
      phase="Phase 5"
      icon="clipboard"
    />
  );
}
