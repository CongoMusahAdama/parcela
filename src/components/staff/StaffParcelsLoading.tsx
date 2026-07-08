"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function StaffParcelsLoading({
  message = "Syncing parcels from server…",
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-border bg-surface p-12 text-center shadow-sm",
        className,
      )}
    >
      <Loader2
        className="mx-auto size-8 animate-spin text-[var(--staff-accent)]"
        strokeWidth={2.25}
      />
      <p className="font-body mt-4 text-sm text-muted">{message}</p>
    </div>
  );
}
