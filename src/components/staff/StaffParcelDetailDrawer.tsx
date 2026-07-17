"use client";

import { useEffect } from "react";
import { Bus, Package, Phone, User, X } from "lucide-react";
import type { StaffParcelDetail } from "@/types/staff-parcel";
import { TRACK_STATUS_LABELS } from "@/lib/tracking";
import { cn } from "@/lib/utils";

type StaffParcelDetailDrawerProps = {
  parcel: StaffParcelDetail | null;
  onClose: () => void;
  variant?: "drawer" | "modal";
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_CLASS: Record<string, string> = {
  pending_dropoff: "bg-amber-50 text-amber-800",
  in_transit: "bg-sky-50 text-sky-800",
  arrived: "bg-violet-50 text-violet-800",
  ready_for_collection: "staff-status-ready",
  collected: "bg-slate-100 text-slate-600",
};

function ParcelDetailContent({
  parcel,
  onClose,
}: {
  parcel: StaffParcelDetail;
  onClose: () => void;
}) {
  const smsBody = encodeURIComponent(
    `Hello ${parcel.senderName}, this is Parcela staff regarding your parcel ${parcel.bookingReference}.`
  );
  const telHref = `tel:${parcel.senderPhone}`;
  const smsHref = `sms:${parcel.senderPhone}?body=${smsBody}`;

  return (
    <>
      <div
        className="shrink-0 px-5 py-4 text-white"
        style={{ background: "var(--staff-header-gradient)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-[10px] font-bold uppercase tracking-widest text-white/75">
              Parcel details
            </p>
            <h2 id="parcel-detail-title" className="font-mono mt-1 text-lg font-bold">
              {parcel.bookingReference}
            </h2>
            <p className="font-mono text-xs text-white/80">Pickup {parcel.pickupCode}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/90 hover:bg-white/15"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        <span
          className={cn(
            "font-display mt-3 inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
            STATUS_CLASS[parcel.status] ?? "bg-white/20 text-white"
          )}
        >
          {TRACK_STATUS_LABELS[parcel.status]}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <section className="rounded-xl border border-border bg-background p-4">
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-muted">
            Route
          </p>
          <p className="font-body mt-2 text-sm text-foreground">
            <span className="font-semibold">{parcel.originStationName}</span>
            <span className="text-muted"> → </span>
            <span className="font-semibold">{parcel.destinationStationName}</span>
          </p>
          <p className="font-body mt-1 text-xs capitalize text-muted">
            {parcel.direction} · {parcel.itemCount} item{parcel.itemCount !== 1 ? "s" : ""}
          </p>
          {parcel.busNumber && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted">
              <Bus className="size-4 shrink-0" style={{ color: "var(--staff-accent)" }} />
              Bus {parcel.busNumber}
            </div>
          )}
        </section>

        <section className="mt-4 rounded-xl border border-border p-4">
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-muted">
            Sender
          </p>
          <div className="mt-2 flex items-center gap-3">
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-full"
              style={{ background: "var(--staff-accent-muted)", color: "var(--staff-accent)" }}
            >
              <User className="size-5" />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-foreground">{parcel.senderName}</p>
              <p className="font-mono text-xs text-muted">{parcel.senderPhone}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={telHref}
              className="font-display inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white"
              style={{ background: "var(--staff-accent)" }}
            >
              <Phone className="size-3.5" />
              Call sender
            </a>
            <a
              href={smsHref}
              className="staff-sign-out-btn font-display inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold"
            >
              SMS sender
            </a>
          </div>
        </section>

        <section className="mt-4 rounded-xl border border-border p-4">
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-muted">
            Recipient
          </p>
          <p className="font-display mt-2 text-sm font-bold text-foreground">
            {parcel.recipientName}
          </p>
          <p className="font-mono mt-1 text-xs text-muted">{parcel.recipientPhone}</p>
        </section>

        <section className="mt-4 rounded-xl border border-border p-4">
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-muted">
            Items in booking
          </p>
          <ul className="mt-3 space-y-2">
            {parcel.items?.length ? (
              parcel.items.map((item, index) => (
                <li
                  key={`${parcel.bookingReference}-item-${index}`}
                  className="flex items-start gap-3 rounded-lg bg-background px-3 py-2.5"
                >
                  <Package className="mt-0.5 size-4 shrink-0 text-muted" />
                  <div>
                    <p className="font-body text-sm font-medium capitalize text-foreground">
                      {item.parcelType}
                      {item.fragile && (
                        <span className="ml-2 text-[10px] font-bold uppercase text-amber-600">
                          Fragile
                        </span>
                      )}
                    </p>
                    <p className="font-body text-xs text-muted">{item.description}</p>
                  </div>
                </li>
              ))
            ) : (
              <li className="rounded-lg bg-background px-3 py-2.5 text-xs text-muted">
                {parcel.itemCount} item{parcel.itemCount === 1 ? "" : "s"} — open verify for full
                breakdown when online.
              </li>
            )}
          </ul>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg bg-background px-3 py-2.5">
            <p className="font-display text-[10px] font-bold uppercase tracking-wide text-muted">
              Booked
            </p>
            <p className="font-body mt-1 text-foreground">{formatDateTime(parcel.createdAt)}</p>
          </div>
          <div className="rounded-lg bg-background px-3 py-2.5">
            <p className="font-display text-[10px] font-bold uppercase tracking-wide text-muted">
              Updated
            </p>
            <p className="font-body mt-1 text-foreground">{formatDateTime(parcel.updatedAt)}</p>
          </div>
        </section>
      </div>
    </>
  );
}

export function StaffParcelDetailDrawer({
  parcel,
  onClose,
  variant = "drawer",
}: StaffParcelDetailDrawerProps) {
  useEffect(() => {
    if (!parcel) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [parcel]);

  if (!parcel) return null;

  if (variant === "modal") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <button
          type="button"
          className="absolute inset-0 bg-foreground/45 backdrop-blur-[2px]"
          onClick={onClose}
          aria-label="Close parcel details"
        />
        <div
          className="relative z-10 flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl"
          role="dialog"
          aria-labelledby="parcel-detail-title"
        >
          <ParcelDetailContent parcel={parcel} onClose={onClose} />
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close parcel details"
      />
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-surface shadow-2xl"
        role="dialog"
        aria-labelledby="parcel-detail-title"
      >
        <ParcelDetailContent parcel={parcel} onClose={onClose} />
      </aside>
    </>
  );
}
