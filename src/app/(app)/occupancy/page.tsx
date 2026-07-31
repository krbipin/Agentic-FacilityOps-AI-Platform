import type { Metadata } from "next";
import { Occupancy } from "@/components/pages/Occupancy";

export const metadata: Metadata = { title: "Occupancy Intelligence" };

export default function OccupancyPage() {
  return <Occupancy />;
}
