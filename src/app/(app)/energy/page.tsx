import type { Metadata } from "next";
import { Energy } from "@/components/pages/Energy";

export const metadata: Metadata = { title: "Energy Intelligence" };

export default function EnergyPage() {
  return <Energy />;
}
