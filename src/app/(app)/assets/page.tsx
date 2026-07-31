import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const metadata: Metadata = { title: "Assets" };

export default function AssetsPage() {
  return (
    <PagePlaceholder
      title="Assets"
      subtitle="2,450 assets monitored by the Maintenance Agent"
      phase="Phase 5"
      icon="box"
    />
  );
}
