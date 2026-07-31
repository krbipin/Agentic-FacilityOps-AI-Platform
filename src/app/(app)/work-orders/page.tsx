import type { Metadata } from "next";
import { WorkOrders } from "@/components/pages/WorkOrders";

export const metadata: Metadata = { title: "Work Orders" };

export default function WorkOrdersPage() {
  return <WorkOrders />;
}
