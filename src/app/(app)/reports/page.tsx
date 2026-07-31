import type { Metadata } from "next";
import { Reports } from "@/components/pages/Reports";

export const metadata: Metadata = { title: "Executive Reporting" };

export default function ReportsPage() {
  return <Reports />;
}
