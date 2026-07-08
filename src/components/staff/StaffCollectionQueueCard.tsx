"use client";

import Link from "next/link";
import { ArrowRight, Clock3, Eye, KeyRound, MapPin, Package, Phone, User } from "lucide-react";
import type { StaffParcelSummary } from "@/types/staff-parcel";

type StaffCollectionQueueCardProps = {
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

export function StaffCollectionQueueCard({
  parcel,
  onView,
}: StaffCollectionQueueCardProps) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm font-bold text-foreground">{parcel.bookingReference}</p>
          <p className="font-mono mt-0.5 text-[11px] text-muted">Pickup {parcel.pickupCode}</p>
        </div>
        <span className="font-display staff-status-ready rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide">
          Ready to collect
        </span>
      </div>

      <div
        className="mt-4 rounded-xl px-4 py-3"
        style={{ background: "var(--staff-accent-muted)" }}
      >
        <p className="font-display text-[10px] font-bold uppercase tracking-wide text-[var(--staff-accent-dark)]">
          Recipient pickup queue
        </p>
        <p className="font-body mt-1 text-sm text-foreground">
          Parcel is at the terminal and waiting for the recipient to arrive with the pickup code.
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
          Ready {formatUpdated(parcel.updatedAt)}
        </span>
      </div>

      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[11px] text-muted">
        <KeyRound className="size-3.5 shrink-0" />
        Pickup code needed before release
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
        <Link
          href="/staff/release"
          className="font-display inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white"
          style={{ background: "var(--staff-accent)" }}
        >
          Recipient pickup
          <ArrowRight className="size-3.5" />
        </Link>
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
      </div>
    </article>
  );
}
