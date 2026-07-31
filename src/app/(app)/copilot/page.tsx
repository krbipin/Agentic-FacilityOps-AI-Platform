import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const metadata: Metadata = { title: "AI Copilot" };

export default function CopilotPage() {
  return (
    <PagePlaceholder
      title="Facility Copilot"
      subtitle="5 agents standing by · Facility Intelligence Engine orchestrating"
      phase="Phase 5"
      icon="sparkles"
    />
  );
}
