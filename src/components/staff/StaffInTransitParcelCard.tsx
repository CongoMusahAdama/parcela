"use client";

import { Bus, Clock, Eye, MapPin, Package, Phone, User } from "lucide-react";
import type { StaffParcelSummary } from "@/types/staff-parcel";
import { toStaffParcelDetail } from "@/types/staff-parcel";

type StaffInTransitParcelCardProps = {
  parcel: StaffParcelSummary;
  onView: () => void;
};

function formatUpdated(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StaffInTransitParcelCard({ parcel, onView }: StaffInTransitParcelCardProps) {
  const detail = toStaffParcelDetail(parcel);

  return (
    <article className="rounded-2xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm font-bold text-foreground">{parcel.bookingReference}</p>
          <p className="font-mono mt-0.5 text-[11px] text-muted">Pickup {parcel.pickupCode}</p>
        </div>
        <span className="font-display rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-sky-800">
          In transit
        </span>
      </div>

      {detail.busNumber && (
        <div
          className="mt-4 flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: "var(--staff-accent-muted)" }}
        >
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-lg text-white"
            style={{ background: "var(--staff-accent)" }}
          >
            <Bus className="size-5" strokeWidth={2.25} />
          </div>
          <div>
            <p className="font-display text-[10px] font-bold uppercase tracking-wide text-[var(--staff-accent-dark)]">
              Assigned bus
            </p>
            <p className="font-display text-lg font-bold text-foreground">{detail.busNumber}</p>
            {detail.driverPhone && (
              <a
                href={`tel:${detail.driverPhone.replace(/\s/g, "")}`}
                className="font-mono mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[var(--staff-accent-dark)] hover:underline"
              >
                <Phone className="size-3" />
                {detail.driverPhone}
                {detail.driverName ? ` · ${detail.driverName}` : ""}
              </a>
            )}
          </div>
          <span
            className={`font-display ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
              parcel.direction === "outgoing"
                ? "bg-background text-muted"
                : "bg-white/80 text-[var(--staff-accent-dark)]"
            }`}
          >
            {parcel.direction === "outgoing" ? "departed" : "incoming"}
          </span>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 text-sm text-foreground">
        <MapPin className="size-4 shrink-0" style={{ color: "var(--staff-accent)" }} />
        <span className="font-medium">{parcel.originStationName}</span>
        <span className="text-muted">→</span>
        <span className="font-medium">{parcel.destinationStationName}</span>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-2.5 rounded-xl bg-background px-3 py-2.5">
          <User className="mt-0.5 size-4 shrink-0 text-muted" />
          <div>
            <p className="font-display text-[10px] font-bold uppercase tracking-wide text-muted">
              Sender
            </p>
            <p className="font-body mt-0.5 text-sm font-medium text-foreground">
              {parcel.senderName}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2.5 rounded-xl bg-background px-3 py-2.5">
          <User className="mt-0.5 size-4 shrink-0 text-muted" />
          <div>
            <p className="font-display text-[10px] font-bold uppercase tracking-wide text-muted">
              Recipient
            </p>
            <p className="font-body mt-0.5 text-sm font-medium text-foreground">
              {parcel.recipientName}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Package className="size-3.5 shrink-0" />
          {parcel.itemCount} item{parcel.itemCount !== 1 ? "s" : ""}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5 shrink-0" />
          Updated {formatUpdated(parcel.updatedAt)}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={onView}
          className="font-display inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-semibold text-foreground hover:border-[var(--staff-accent)] hover:text-[var(--staff-accent)]"
        >
          <Eye className="size-3.5" />
          View details
        </button>
        <a
          href={`tel:${parcel.senderPhone}`}
          className="font-display inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-white"
          style={{ background: "var(--staff-accent)" }}
        >
          <Phone className="size-3.5" />
          Contact sender
        </a>
      </div>
    </article>
  );
}
