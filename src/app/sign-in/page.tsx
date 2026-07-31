import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Sign in · FacilityOps AI",
};

export default function SignInPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <SignIn />
    </div>
  );
}
