import { AlertTriangle, Clock } from "lucide-react";
import {
  calculateHoldingPenalty,
  DAILY_PENALTY_GHS,
  formatPenaltyDeadline,
  HOLDING_GRACE_DAYS,
} from "@/lib/tracking-shared";
import type { ParcelTrackStatus } from "@/types/parcel";
import { cn } from "@/lib/utils";

type PenaltyNoticeProps = {
  arrivedAt?: string;
  status: ParcelTrackStatus;
  className?: string;
  embedded?: boolean;
};

export function PenaltyNotice({
  arrivedAt,
  status,
  className,
  embedded = false,
}: PenaltyNoticeProps) {
  const penalty = calculateHoldingPenalty(arrivedAt, status);
  if (!penalty) return null;

  if (!penalty.isOverdue) {
    return (
      <div
        className={cn(
          "rounded-xl border border-border bg-surface px-3.5 py-3",
          !embedded && "mt-3",
          className
        )}
      >
        <div className="flex gap-2.5">
          <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <p className="font-display text-xs font-bold text-foreground">Free holding period</p>
            <p className="font-body mt-1 text-[11px] leading-relaxed text-muted">
              Collect by{" "}
              <span className="font-semibold text-foreground">
                {formatPenaltyDeadline(penalty.deadline)}
              </span>{" "}
              ({HOLDING_GRACE_DAYS} days after arrival). After that, GHS {DAILY_PENALTY_GHS} per day
              applies.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-danger/25 bg-danger/5 px-3.5 py-3",
        !embedded && "mt-3",
        className
      )}
    >
      <div className="flex gap-2.5">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" />
        <div>
          <p className="font-display text-xs font-bold text-danger">Storage fees apply</p>
          <p className="font-body mt-1 text-[11px] leading-relaxed text-muted">
            {penalty.daysOverdue} day{penalty.daysOverdue === 1 ? "" : "s"} past the free period.
            Estimated fee:{" "}
            <span className="font-display font-bold text-danger">
              GHS {penalty.totalPenaltyGhs.toFixed(0)}
            </span>{" "}
            (GHS {penalty.dailyRateGhs}/day). Pay at the station before collection.
          </p>
        </div>
      </div>
    </div>
  );
}
