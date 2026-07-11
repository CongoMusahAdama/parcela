import Link from "next/link";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import { StationIcon } from "@/components/send/StationIcon";
import type { Station } from "@/types/parcel";
import { operatorBadgeClass } from "@/lib/operators";
import { formatDistance } from "@/lib/utils";
import { cn } from "@/lib/utils";

type StationCardProps = {
  station: Station;
  distanceKm?: number;
  href: string;
};

const operatorBadge = operatorBadgeClass;

export function StationCard({ station, distanceKm, href }: StationCardProps) {
  return (
    <Link href={href} className="group block">
      <article className="overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-primary/35">
        <div className="flex gap-3 p-3.5">
          <StationIcon operator={station.operator} />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <h3 className="font-display text-[0.9375rem] font-semibold leading-tight text-foreground">
                  {station.name}
                </h3>
                <span className="font-display rounded-md bg-background px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-muted">
                  {station.code}
                </span>
                <span
                  className={cn(
                    "font-display rounded-md px-1.5 py-px text-[10px] font-bold uppercase",
                    operatorBadge(station.operator)
                  )}
                >
                  {station.operator}
                </span>
              </div>

              {distanceKm !== undefined && (
                <span className="font-display shrink-0 text-[11px] font-semibold text-primary">
                  {formatDistance(distanceKm)}
                </span>
              )}
            </div>

            <p className="font-body mt-1.5 flex items-center gap-1 text-[13px] leading-snug text-muted">
              <MapPin className="size-3 shrink-0 text-primary" strokeWidth={2.25} />
              <span className="truncate">
                {station.address}, {station.city}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-3.5 py-2.5">
          <p className="font-body flex min-w-0 items-center gap-1.5 text-xs text-muted">
            <Clock className="size-3 shrink-0 opacity-60" strokeWidth={2} />
            <span className="truncate">{station.hours}</span>
          </p>

          <span className="font-display inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-primary transition-colors group-hover:text-primary-dark">
            Select
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </article>
    </Link>
  );
}
