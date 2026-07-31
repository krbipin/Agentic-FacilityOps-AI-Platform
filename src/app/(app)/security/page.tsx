import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const metadata: Metadata = { title: "Security" };

export default function SecurityPage() {
  return (
    <PagePlaceholder
      title="Security Dashboard"
      subtitle="Monitored by the Security Agent"
      phase="Phase 3"
      icon="shield"
    />
  );
}
