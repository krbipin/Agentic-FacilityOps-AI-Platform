import type { Metadata } from "next";
import { UserProfile } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Account · FacilityOps AI",
};

export default function UserProfilePage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <UserProfile />
    </div>
  );
}
