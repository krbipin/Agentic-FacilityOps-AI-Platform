import type { Metadata } from "next";
import { Overview } from "@/components/pages/Overview";

export const metadata: Metadata = { title: "Facility Operations" };

export default function OverviewPage() {
  return <Overview />;
}
