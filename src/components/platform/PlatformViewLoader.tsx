"use client";

import { StaffPreloader } from "@/components/staff/StaffPreloader";

export function PlatformViewLoader({ message = "Loading page" }: { message?: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <StaffPreloader variant="page" message={message} className="min-h-0 flex-none py-0" />
    </div>
  );
}
