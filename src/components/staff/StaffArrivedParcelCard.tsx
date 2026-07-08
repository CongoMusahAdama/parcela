"use client";

import Link from "next/link";
import { CheckCircle2, Clock3, Eye, MapPin, Package, Phone, User } from "lucide-react";
import type { StaffParcelSummary } from "@/types/staff-parcel";

type StaffArrivedParcelCardProps = {
  parcel: StaffParcelSummary;
  onView: () => void;
  onMarkReady: () => void;
};

function formatUpdated(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StaffArrivedParcelCard({
  parcel,
  onView,
  onMarkReady,
}: StaffArrivedParcelCardProps) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm font-bold text-foreground">{parcel.bookingReference}</p>
          <p className="font-mono mt-0.5 text-[11px] text-muted">Pickup {parcel.pickupCode}</p>
        </div>
        <span className="font-display rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-800">
          Arrived
        </span>
      </div>

      <div
        className="mt-4 rounded-xl px-4 py-3"
        style={{ background: "var(--staff-accent-muted)" }}
      >
        <p className="font-display text-[10px] font-bold uppercase tracking-wide text-[var(--staff-accent-dark)]">
          Ready for destination staff check
        </p>
        <p className="font-body mt-1 text-sm text-foreground">
          Confirm the parcel is at <span className="font-semibold">{parcel.destinationStationName}</span>,
          then move it to collection.
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
            <p className="font-mono text-[11px] text-muted">{parcel.recipientPhone}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0" style={{ color: "var(--staff-accent)" }} />
          From {parcel.originStationName}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Package className="size-3.5 shrink-0" />
          {parcel.itemCount} item{parcel.itemCount !== 1 ? "s" : ""}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock3 className="size-3.5 shrink-0" />
          Arrived {formatUpdated(parcel.updatedAt)}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={onMarkReady}
          className="font-display inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white"
          style={{ background: "var(--staff-accent)" }}
        >
          <CheckCircle2 className="size-3.5" />
          Mark ready
        </button>
        <button
          type="button"
          onClick={onView}
          className="font-display inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-semibold text-foreground hover:border-[var(--staff-accent)] hover:text-[var(--staff-accent)]"
        >
          <Eye className="size-3.5" />
          View details
        </button>
        <a
          href={`tel:${parcel.recipientPhone}`}
          className="font-display inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-semibold text-foreground hover:border-[var(--staff-accent)] hover:text-[var(--staff-accent)]"
        >
          <Phone className="size-3.5" />
          Contact recipient
        </a>
        <Link
          href="/staff/collection"
          className="font-display inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-semibold text-foreground hover:border-[var(--staff-accent)] hover:text-[var(--staff-accent)]"
        >
          Collection queue
        </Link>
      </div>
    </article>
  );
}
