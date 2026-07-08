import { Suspense } from "react";
import { StaffVerifyView } from "@/components/staff/StaffVerifyView";

export const metadata = { title: "Verify & log — Parcela Staff" };

export default function StaffVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center px-6">
          <p className="font-body text-sm text-muted">Loading verify form…</p>
        </div>
      }
    >
      <StaffVerifyView />
    </Suspense>
  );
}
