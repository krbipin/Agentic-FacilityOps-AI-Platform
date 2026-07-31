import type { Metadata } from "next";
import { Settings } from "@/components/pages/Settings";

export const metadata: Metadata = { title: "Settings & Integrations" };

export default function SettingsPage() {
  return <Settings />;
}
