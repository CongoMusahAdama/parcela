import Link from "next/link";
import { ChevronRight, Navigation } from "lucide-react";
import type { Station } from "@/types/parcel";
import { getOperatorLabel, operatorAccentColor } from "@/lib/operators";
import { formatDistance, cn } from "@/lib/utils";

type StationCardProps = {
  station: Station;
  distanceKm?: number;
  href: string;
  highlighted?: boolean;
  compact?: boolean;
};

export function StationCard({
  station,
  distanceKm,
  href,
  highlighted,
  compact = false,
}: StationCardProps) {
  const accent = operatorAccentColor(station.operator);
  const operatorName = getOperatorLabel(station.operator);

  return (
    <Link href={href} className="group block">
      <article
        className={cn(
          "relative flex items-stretch overflow-hidden rounded-xl border bg-surface transition-all active:scale-[0.99]",
          compact ? "min-h-[52px]" : "min-h-[64px] rounded-2xl",
          highlighted
            ? "border-primary/40 bg-primary/[0.03]"
            : "border-border hover:border-primary/30",
        )}
      >
        <span
          className={cn("shrink-0 self-stretch", compact ? "w-1" : "w-1.5")}
          style={{ backgroundColor: accent }}
          aria-hidden
        />

        <div
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2",
            compact ? "px-3 py-2" : "gap-3 px-3.5 py-3",
          )}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3
                className={cn(
                  "font-display truncate font-bold tracking-tight text-foreground",
                  compact ? "text-[13px] leading-tight" : "text-[0.95rem] leading-snug",
                )}
              >
                {station.name}
              </h3>
              {distanceKm !== undefined ? (
                <span className="font-display inline-flex shrink-0 items-center gap-0.5 text-[10px] font-bold text-primary">
                  <Navigation className="size-2.5" strokeWidth={2.5} />
                  {formatDistance(distanceKm)}
                </span>
              ) : null}
            </div>

            <p
              className={cn(
                "font-body flex min-w-0 items-center gap-1.5 text-muted",
                compact ? "mt-0.5 text-[11px]" : "mt-1 text-[13px]",
              )}
            >
              <span className="truncate">{station.city}</span>
              <span className="text-border">·</span>
              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: accent }}
                aria-hidden
              />
              <span className="truncate">{operatorName}</span>
              {highlighted ? (
                <>
                  <span className="text-border">·</span>
                  <span className="shrink-0 font-semibold text-primary">Nearest</span>
                </>
              ) : null}
            </p>
          </div>

          <span
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full transition-colors",
              compact ? "size-7" : "size-9",
              highlighted
                ? "bg-primary text-white"
                : "bg-background text-muted group-hover:bg-primary/10 group-hover:text-primary",
            )}
            aria-hidden
          >
            <ChevronRight className={compact ? "size-3.5" : "size-4"} strokeWidth={2.5} />
          </span>
        </div>
      </article>
    </Link>
  );
}
