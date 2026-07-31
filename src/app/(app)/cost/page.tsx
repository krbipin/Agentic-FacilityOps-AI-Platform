import type { Metadata } from "next";
import { Cost } from "@/components/pages/Cost";

export const metadata: Metadata = { title: "Cost Optimization" };

export default function CostPage() {
  return <Cost />;
}
