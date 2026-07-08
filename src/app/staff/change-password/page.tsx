import { Suspense } from "react";
import { StaffChangePasswordView } from "@/components/staff/StaffChangePasswordView";

export default function StaffChangePasswordPage() {
  return (
    <Suspense fallback={<div className="staff-portal min-h-dvh bg-[#eef2f6]" aria-hidden />}>
      <StaffChangePasswordView />
    </Suspense>
  );
}
