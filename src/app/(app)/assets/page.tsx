import type { Metadata } from "next";
import { Assets } from "@/components/pages/Assets";

export const metadata: Metadata = { title: "Assets" };

export default function AssetsPage() {
  return <Assets />;
}
