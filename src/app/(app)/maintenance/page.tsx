import type { Metadata } from "next";
import { Maintenance } from "@/components/pages/Maintenance";

export const metadata: Metadata = { title: "Predictive Maintenance" };

export default function MaintenancePage() {
  return <Maintenance />;
}
