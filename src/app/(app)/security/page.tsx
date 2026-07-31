import type { Metadata } from "next";
import { Security } from "@/components/pages/Security";

export const metadata: Metadata = { title: "Security Monitoring" };

export default function SecurityPage() {
  return <Security />;
}
