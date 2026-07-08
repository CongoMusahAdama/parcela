"use client";

import { useCallback, useRef, useState } from "react";
import { CheckCircle2, Printer, Tag, X } from "lucide-react";
import { ParcelTagReceipt } from "@/components/parcel/ParcelTagReceipt";
import { buildParcelTagFields, type ParcelTagFields } from "@/lib/parcel-tag";
import type { Operator } from "@/types/parcel";
import type { StaffParcelItem } from "@/types/staff-parcel";

export type StaffTagFillContext = {
  bookingReference: string;
  pickupCode: string;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  originStationId: string;
  destinationStationId: string;
  originStationName: string;
  destinationStationName: string;
  items: StaffParcelItem[];
  busNumber: string;
  driverPhone: string;
  driverName?: string;
  loggedAt: string;
  operator: Operator;
};

type StaffParcelTagFillModalProps = {
  context: StaffTagFillContext;
  onDone: () => void;
};

export function StaffParcelTagFillModal({ context, onDone }: StaffParcelTagFillModalProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const tag: ParcelTagFields = buildParcelTagFields({
    operator: context.operator,
    bookingReference: context.bookingReference,
    pickupCode: context.pickupCode,
    loggedAt: context.loggedAt,
    senderName: context.senderName,
    senderPhone: context.senderPhone,
    recipientName: context.recipientName,
    recipientPhone: context.recipientPhone,
    originStationId: context.originStationId,
    destinationStationId: context.destinationStationId,
    originStationName: context.originStationName,
    destinationStationName: context.destinationStationName,
    items: context.items,
    busNumber: context.busNumber,
    driverPhone: context.driverPhone,
    driverName: context.driverName,
    statusLabel: "In transit",
  });

  const handlePrint = useCallback(() => {
    if (typeof window === "undefined") return;
    const node = printRef.current;
    if (!node) return;

    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=720,height=480");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${context.bookingReference} · Fill tag</title>
          <style>
            body { margin: 0; padding: 16px; font-family: system-ui, sans-serif; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>${node.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }, [context.bookingReference]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6">
      <div
        role="dialog"
        aria-labelledby="fill-tag-title"
        className="flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
      >
        <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
                style={{
                  background: "var(--staff-accent-muted)",
                  color: "var(--staff-accent)",
                }}
              >
                <Tag className="size-3.5" />
                Fill parcel tag
              </div>
              <h2 id="fill-tag-title" className="font-display text-base font-bold text-foreground sm:text-lg">
                Copy onto blank tag
              </h2>
            </div>
            <p className="font-body mt-1 text-xs text-muted sm:text-sm">
              Bus {context.busNumber} · driver {context.driverPhone}
              {context.driverName ? ` (${context.driverName})` : ""} · write on the physical tag.
            </p>
          </div>
          <button
            type="button"
            onClick={onDone}
            className="shrink-0 rounded-lg p-2 text-muted hover:bg-background hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="px-4 py-3 sm:px-5">
          <div ref={printRef}>
            <ParcelTagReceipt
              id="staff-fill-tag"
              tag={tag}
              variant="counter-tag"
              compact
            />
          </div>

          <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5 has-[:checked]:border-[var(--staff-accent)] has-[:checked]:bg-[var(--staff-accent-muted)]">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={() => setAcknowledged((prev) => !prev)}
              className="size-4 shrink-0 accent-[var(--staff-accent)]"
            />
            <span className="font-body text-sm text-foreground">
              Tag is filled and attached to the parcel
            </span>
          </label>
        </div>

        <footer className="flex gap-2 border-t border-border px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={handlePrint}
            className="font-display flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background py-2.5 text-sm font-semibold text-foreground hover:border-[var(--staff-accent)]"
          >
            <Printer className="size-4" />
            Print reference
          </button>
          <button
            type="button"
            disabled={!acknowledged}
            onClick={onDone}
            className="font-display flex flex-[1.2] items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold uppercase tracking-wide text-white disabled:opacity-50"
            style={{ background: "var(--staff-accent)" }}
          >
            <CheckCircle2 className="size-4" />
            Done — view in transit
          </button>
        </footer>
      </div>
    </div>
  );
}
