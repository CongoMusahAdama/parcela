import { Check } from "lucide-react";
import type { ParcelTrackStatus } from "@/types/parcel";
import { TRACK_STATUS_LABELS } from "@/lib/tracking";
import { cn } from "@/lib/utils";

const STATUS_ORDER: ParcelTrackStatus[] = [
  "pending_dropoff",
  "in_transit",
  "arrived",
  "ready_for_collection",
  "collected",
];

type ParcelStatusTimelineProps = {
  status: ParcelTrackStatus;
};

export function ParcelStatusTimeline({ status }: ParcelStatusTimelineProps) {
  const currentIndex = STATUS_ORDER.indexOf(status);

  return (
    <ol className="relative space-y-0 py-1">
      {STATUS_ORDER.map((step, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === STATUS_ORDER.length - 1;

        return (
          <li key={step} className="relative flex items-center gap-3 pb-4 last:pb-0">
            {!isLast && (
              <div
                className={cn(
                  "absolute left-[11px] top-6 h-[calc(100%-8px)] w-px",
                  isComplete ? "bg-primary/50" : "bg-border"
                )}
                aria-hidden
              />
            )}

            <div
              className={cn(
                "relative z-10 flex size-[22px] shrink-0 items-center justify-center rounded-full",
                isComplete && "bg-primary",
                isCurrent && "bg-primary ring-4 ring-primary/15",
                !isComplete && !isCurrent && "border-2 border-border bg-surface"
              )}
            >
              {isComplete ? (
                <Check className="size-3 text-white" strokeWidth={3} />
              ) : isCurrent ? (
                <span className="size-1.5 rounded-full bg-white" />
              ) : null}
            </div>

            <p
              className={cn(
                "font-display text-sm leading-tight",
                isCurrent && "font-bold text-primary",
                isComplete && "font-medium text-foreground",
                !isComplete && !isCurrent && "text-muted"
              )}
            >
              {TRACK_STATUS_LABELS[step]}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
