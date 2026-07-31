import type { Metadata } from "next";
import { Intelligence } from "@/components/pages/Intelligence";

export const metadata: Metadata = { title: "Facility Intelligence" };

export default function IntelligencePage() {
  return <Intelligence />;
}
