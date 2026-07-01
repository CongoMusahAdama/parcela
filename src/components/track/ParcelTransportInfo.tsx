import { Bus, Phone } from "lucide-react";
import type { TrackedParcel } from "@/types/parcel";
import type { ParcelTrackStatus } from "@/types/parcel";

const TRANSPORT_VISIBLE: ParcelTrackStatus[] = [
  "in_transit",
  "arrived",
  "ready_for_collection",
  "collected",
];

type ParcelTransportInfoProps = {
  parcel: TrackedParcel;
  compact?: boolean;
};

export function hasTransportInfo(status: ParcelTrackStatus): boolean {
  return TRANSPORT_VISIBLE.includes(status);
}

export function ParcelTransportInfo({ parcel, compact = false }: ParcelTransportInfoProps) {
  if (!hasTransportInfo(parcel.status)) {
    return (
      <p className="font-body text-[11px] leading-snug text-muted">
        Bus and driver details appear once your parcel is on a trip.
      </p>
    );
  }

  if (!parcel.busNumber && !parcel.driverPhone) return null;

  if (compact) {
    return (
      <div className="flex overflow-hidden rounded-lg border border-border bg-surface">
        {parcel.busNumber && (
          <div className="flex min-w-0 flex-1 items-center gap-2 border-r border-border px-2.5 py-2">
            <Bus className="size-3.5 shrink-0 text-primary" strokeWidth={2} />
            <div className="min-w-0">
              <p className="font-display text-[9px] font-semibold uppercase tracking-wide text-muted">
                Bus
              </p>
              <p className="font-mono truncate text-xs font-bold text-foreground">
                {parcel.busNumber}
              </p>
            </div>
          </div>
        )}
        {parcel.driverPhone && (
          <div className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2">
            <Phone className="size-3.5 shrink-0 text-primary" strokeWidth={2} />
            <div className="min-w-0">
              <p className="font-display text-[9px] font-semibold uppercase tracking-wide text-muted">
                Driver
              </p>
              <a
                href={`tel:${parcel.driverPhone.replace(/\s/g, "")}`}
                className="font-mono block truncate text-xs font-bold text-primary hover:underline"
              >
                {parcel.driverPhone}
              </a>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
      <p className="font-display mb-2.5 text-xs font-semibold text-foreground">
        Your parcel&apos;s bus
      </p>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {parcel.busNumber && (
          <div className="flex items-start gap-2.5 rounded-lg bg-background px-3 py-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bus className="size-4" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="font-display text-[10px] font-semibold uppercase tracking-wide text-muted">
                Bus number
              </p>
              <p className="font-mono mt-0.5 text-sm font-bold text-foreground">{parcel.busNumber}</p>
            </div>
          </div>
        )}
        {parcel.driverPhone && (
          <div className="flex items-start gap-2.5 rounded-lg bg-background px-3 py-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Phone className="size-4" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="font-display text-[10px] font-semibold uppercase tracking-wide text-muted">
                Driver (active)
              </p>
              <a
                href={`tel:${parcel.driverPhone.replace(/\s/g, "")}`}
                className="font-mono mt-0.5 inline-block text-sm font-bold text-primary hover:underline"
              >
                {parcel.driverPhone}
              </a>
              {parcel.driverName && (
                <p className="font-body mt-0.5 text-[11px] text-muted">{parcel.driverName}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
