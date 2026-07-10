"use client";

import type { PlatformSubscriptionSnapshot, PlatformSubscriptionStatus } from "@/lib/platform-demo";
import {
  formatSubscriptionCountdown,
  platformSubscriptionStatusLabel,
} from "@/lib/platform-demo";
import { cn } from "@/lib/utils";

function subscriptionStatusTone(status: PlatformSubscriptionStatus) {
  if (status === "active") return "bg-emerald-50 text-emerald-900 ring-emerald-200";
  if (status === "expiring") return "bg-amber-50 text-amber-900 ring-amber-200";
  if (status === "expired") return "bg-red-50 text-red-900 ring-red-200";
  return "bg-stone-100 text-stone-700 ring-stone-200";
}

function progressTone(status: PlatformSubscriptionStatus) {
  if (status === "active") return "bg-emerald-500";
  if (status === "expiring") return "bg-amber-500";
  if (status === "expired") return "bg-red-500";
  return "bg-stone-300";
}

type PlatformSubscriptionCountdownProps = {
  snapshot: PlatformSubscriptionSnapshot;
  compact?: boolean;
  showProgress?: boolean;
  className?: string;
};

export function PlatformSubscriptionCountdown({
  snapshot,
  compact = false,
  showProgress = true,
  className,
}: PlatformSubscriptionCountdownProps) {
  const countdown = formatSubscriptionCountdown(snapshot.daysRemaining);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "font-display inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
            subscriptionStatusTone(snapshot.status),
          )}
        >
          {platformSubscriptionStatusLabel(snapshot.status)}
        </span>
        {!compact ? (
          <span className="font-display text-sm font-bold text-stone-900">{countdown}</span>
        ) : null}
      </div>

      {compact ? (
        <p className="font-display text-sm font-bold text-stone-900">{countdown}</p>
      ) : null}

      {showProgress && snapshot.status !== "unpaid" ? (
        <div>
          <div className="h-2 overflow-hidden rounded-full bg-stone-100">
            <div
              className={cn("h-full rounded-full transition-all", progressTone(snapshot.status))}
              style={{ width: `${snapshot.progressPercent}%` }}
            />
          </div>
          <p className="font-body mt-1 text-[11px] text-stone-500">
            {snapshot.progressPercent}% of licence term used · expires {snapshot.expiresLabel}
          </p>
        </div>
      ) : null}

      {snapshot.dueReminder && snapshot.nextReminderLabel ? (
        <p className="font-body text-[11px] font-medium text-amber-800">
          Send {snapshot.nextReminderLabel} — not sent yet
        </p>
      ) : null}
    </div>
  );
}

export function PlatformSubscriptionReminderPills({
  sent,
  due,
}: {
  sent: string[];
  due: string | null;
}) {
  const labels: { id: string; label: string }[] = [
    { id: "30d", label: "30d" },
    { id: "14d", label: "14d" },
    { id: "7d", label: "7d" },
    { id: "1d", label: "1d" },
  ];

  return (
    <div className="flex flex-wrap gap-1">
      {labels.map((item) => {
        const isSent = sent.includes(item.id);
        const isDue = due === item.id;
        return (
          <span
            key={item.id}
            className={cn(
              "font-mono rounded-md px-1.5 py-0.5 text-[10px] font-bold",
              isSent
                ? "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200"
                : isDue
                  ? "bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-300"
                  : "bg-stone-100 text-stone-400",
            )}
            title={isSent ? "Sent" : isDue ? "Due now" : "Scheduled"}
          >
            {item.label}
          </span>
        );
      })}
    </div>
  );
}
