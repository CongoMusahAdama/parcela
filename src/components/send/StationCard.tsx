import Link from "next/link";
import { ChevronRight, MapPin, Navigation } from "lucide-react";
import type { Station } from "@/types/parcel";
import { getOperatorLabel, operatorAccentColor } from "@/lib/operators";
import { formatDistance, cn } from "@/lib/utils";

type StationCardProps = {
  station: Station;
  distanceKm?: number;
  href: string;
  /** Emphasize as nearest / recommended */
  highlighted?: boolean;
};

export function StationCard({ station, distanceKm, href, highlighted }: StationCardProps) {
  const accent = operatorAccentColor(station.operator);
  const operatorName = getOperatorLabel(station.operator);

  return (
    <Link href={href} className="group block">
      <article
        className={cn(
          "relative flex min-h-[72px] items-stretch overflow-hidden rounded-2xl border bg-surface transition-all active:scale-[0.99]",
          highlighted
            ? "border-primary/40 shadow-[0_8px_24px_-12px_rgb(13_148_136_/_0.45)]"
            : "border-border hover:border-primary/30",
        )}
      >
        <span
          className="w-1.5 shrink-0 self-stretch"
          style={{ backgroundColor: accent }}
          aria-hidden
        />

        <div className="flex min-w-0 flex-1 items-center gap-3 px-3.5 py-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-[0.95rem] font-bold leading-snug tracking-tight text-foreground">
                {station.name}
              </h3>
              {distanceKm !== undefined ? (
                <span className="font-display inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                  <Navigation className="size-3" strokeWidth={2.5} />
                  {formatDistance(distanceKm)}
                </span>
              ) : null}
            </div>

            <p className="font-body mt-1 flex items-center gap-1.5 text-[13px] text-muted">
              <MapPin className="size-3.5 shrink-0 opacity-70" strokeWidth={2.25} />
              <span className="truncate">{station.city}</span>
              <span className="text-border">·</span>
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: accent }}
                aria-hidden
              />
              <span className="truncate font-medium text-foreground/80">{operatorName}</span>
            </p>

            {highlighted ? (
              <p className="font-display mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                Closest to you
              </p>
            ) : null}
          </div>

          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full transition-colors",
              highlighted
                ? "bg-primary text-white"
                : "bg-background text-muted group-hover:bg-primary/10 group-hover:text-primary",
            )}
            aria-hidden
          >
            <ChevronRight className="size-4" strokeWidth={2.5} />
          </span>
        </div>
      </article>
    </Link>
  );
}
