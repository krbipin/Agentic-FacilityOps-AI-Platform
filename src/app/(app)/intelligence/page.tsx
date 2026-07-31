import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const metadata: Metadata = { title: "Facility Intelligence" };

export default function IntelligencePage() {
  return (
    <PagePlaceholder
      title="Facility Intelligence"
      subtitle="Synthesized by the Facility Intelligence Engine"
      phase="Phase 4"
      icon="brain"
    />
  );
}
