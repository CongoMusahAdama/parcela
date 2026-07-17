"use client";

import { ShieldAlert } from "lucide-react";
import { useOptionalOperatorLocks } from "@/components/operator/OperatorLocksContext";
import {
  getLeadFreezeMessage,
  getStaffFreezeMessage,
} from "@/lib/operator-controls";
import { cn } from "@/lib/utils";

type OperatorFreezeBannerProps = {
  operator: string;
  /** Which lock this portal cares about. */
  mode: "staff" | "lead";
  className?: string;
};

export function OperatorFreezeBanner({ operator, mode, className }: OperatorFreezeBannerProps) {
  const locksContext = useOptionalOperatorLocks();
  const locks = locksContext?.locks ?? null;

  if (!locks) return null;
  const frozen = mode === "staff" ? locks.staffOpsLocked : locks.leadOpsLocked;
  if (!frozen) return null;

  const message =
    mode === "staff" ? getStaffFreezeMessage(operator) : getLeadFreezeMessage(operator);

  return (
    <div
      className={cn(
        "border-b border-red-200 bg-red-50 px-4 py-2.5 sm:px-6",
        className,
      )}
      role="status"
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700">
          <ShieldAlert className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="font-display text-xs font-bold uppercase tracking-wide text-red-900">
            Operations frozen by HQ
          </p>
          <p className="font-body mt-0.5 text-[11px] leading-snug text-red-800/90">{message}</p>
        </div>
      </div>
    </div>
  );
}
