import type { Metadata } from "next";
import { Copilot } from "@/components/pages/Copilot";

export const metadata: Metadata = { title: "AI Copilot" };

export default function CopilotPage() {
  return <Copilot />;
}
