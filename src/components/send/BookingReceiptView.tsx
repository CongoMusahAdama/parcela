"use client";

import { useCallback, useState } from "react";
import { OperatorLogo } from "@/components/brand/OperatorLogo";
import { captureReceiptAsPng } from "@/lib/receiptExport";
import { resolveBookingOperator, resolveDestinationOperator } from "@/lib/booking";
import { formatItemLabel } from "@/lib/bookingItems";
import { OPERATOR_LABELS } from "@/lib/operators";
import { showSuccessAlert } from "@/lib/sweetalert";
import type { PreBooking } from "@/types/parcel";

type SaveReceiptResult = "saved" | "shared" | "cancelled" | "failed";

export function useSaveReceipt(booking: PreBooking) {
  const [saving, setSaving] = useState(false);

  const save = useCallback(async (): Promise<SaveReceiptResult> => {
    const node = document.getElementById("booking-receipt");
    if (!node || saving) return "failed";

    setSaving(true);
    try {
      const dataUrl = await captureReceiptAsPng(node);

      const fileName = `${booking.bookingReference}-receipt.png`;
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: "image/png" });

      if (
        typeof navigator !== "undefined" &&
        navigator.share &&
        navigator.canShare?.({ files: [file] })
      ) {
        try {
          await navigator.share({
            files: [file],
            title: "Parcela booking receipt",
            text: `Booking ${booking.bookingReference}`,
          });
          await showSuccessAlert({
            title: "Receipt shared!",
            text: `Take this to ${booking.stationName} when you drop off. After staff register your parcel, send the tracking receipt to your recipient.`,
          });
          return "shared";
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") return "cancelled";
          throw err;
        }
      }

      const link = document.createElement("a");
      link.download = fileName;
      link.href = dataUrl;
      link.click();
      await showSuccessAlert({
        title: "Receipt saved!",
        text: `Take this to ${booking.stationName} when you drop off. After staff register your parcel, send the tracking receipt to your recipient.`,
      });
      return "saved";
    } catch {
      return "failed";
    } finally {
      setSaving(false);
    }
  }, [booking, saving]);

  return { saving, save };
}

export function usePrintReceipt() {
  const [printing, setPrinting] = useState(false);

  const print = useCallback(async () => {
    if (printing || typeof window === "undefined") return false;
    setPrinting(true);
    try {
      window.print();
      return true;
    } finally {
      setPrinting(false);
    }
  }, [printing]);

  return { printing, print };
}

function formatReceiptDate(iso: string) {
  try {
    const d = new Date(iso);
    const date = d
      .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      .toUpperCase();
    const time = d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${date} | ${time}`;
  } catch {
    return iso;
  }
}

function ReceiptDivider() {
  return (
    <div
      data-receipt-divider
      className="border-t border-dashed border-[#e2e8f0]"
    />
  );
}

function ReceiptField({
  label,
  value,
  valueClassName,
  valueTone = "default",
}: {
  label: string;
  value: string;
  valueClassName?: string;
  valueTone?: "default" | "primary";
}) {
  return (
    <div className="min-w-0 text-left">
      <p
        data-receipt-muted
        className="font-display text-[10px] font-semibold uppercase tracking-wide text-[#64748b]"
      >
        {label}
      </p>
      <p
        data-receipt-value={valueTone === "default" ? true : undefined}
        data-receipt-primary={valueTone === "primary" ? true : undefined}
        className={`font-display mt-1 text-[13px] font-bold leading-snug break-words text-[#0f172a] ${valueClassName ?? ""} ${valueTone === "primary" ? "font-mono text-[#0d9488]" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

type BookingReceiptCardProps = {
  booking: PreBooking;
};

export function BookingReceiptCard({ booking }: BookingReceiptCardProps) {
  const operator = resolveBookingOperator(booking);
  const destinationOperator = resolveDestinationOperator(booking);
  const code = booking.pickupCode.replace(/-/g, "");

  return (
    <div
      id="booking-receipt"
      className="receipt-card relative isolate box-border w-full overflow-hidden bg-[#ffffff] text-[#0f172a]"
    >
      <OperatorLogo operator={operator} variant="watermark" />

      <div className="relative z-10 px-5">
        <div className="py-4 text-center">
          <div className="flex justify-center">
            <OperatorLogo operator={operator} className="h-9" />
          </div>
          <h2 className="font-display mt-2 text-xl font-bold text-[#0f172a]">Thank you</h2>
          <p data-receipt-muted className="font-body mt-1 text-[13px] text-[#64748b]">
            Your booking is confirmed
          </p>
        </div>

        <ReceiptDivider />

        <div className="grid grid-cols-2 items-start gap-x-4 gap-y-3 py-3">
          <ReceiptField
            label="Tracking ID"
            value={booking.pickupCode}
            valueTone="primary"
          />
          <ReceiptField label="Status" value="Awaiting drop-off" />
          <ReceiptField label="Date & time" value={formatReceiptDate(booking.createdAt)} />
          <ReceiptField label="Transport" value={OPERATOR_LABELS[operator]} />
        </div>

        <div
          data-receipt-tint
          className="rounded-lg border border-[#99f6e4] bg-[#f0fdfa] px-3 py-3"
        >
          <div className="grid grid-cols-2 items-start gap-x-4 gap-y-3">
            <ReceiptField label="Drop-off" value={booking.stationName} />
            <ReceiptField label="Destination" value={booking.destinationStationName} />
          </div>
          {destinationOperator && destinationOperator !== operator && (
            <p data-receipt-muted className="font-body mt-2 text-[11px] text-[#64748b]">
              Destination via {OPERATOR_LABELS[destinationOperator]}
            </p>
          )}
        </div>

        <ReceiptDivider />

        <div className="grid grid-cols-2 items-start gap-x-4 gap-y-3 py-3">
          <ReceiptField label="Sender" value={booking.senderName} />
          <ReceiptField label="Phone" value={booking.senderPhone} />
          <ReceiptField label="Recipient" value={booking.recipientName} />
          <ReceiptField label="Phone" value={booking.recipientPhone} />
        </div>

        <ReceiptDivider />

        <div className="py-3">
          <p
            data-receipt-muted
            className="font-display text-[10px] font-bold uppercase tracking-wide text-[#64748b]"
          >
            Items ({booking.items.length}) — one ID tracks all
          </p>
          <div className="mt-2 space-y-2">
            {booking.items.map((item, index) => (
              <p
                key={item.id}
                data-receipt-value
                className="font-body text-[13px] leading-snug text-[#0f172a]"
              >
                {formatItemLabel(item, index)}
              </p>
            ))}
          </div>
        </div>

        <ReceiptDivider />

        <div className="grid grid-cols-2 items-start gap-x-4 gap-y-3 py-3">
          <ReceiptField label="Booking ref" value={booking.bookingReference} />
          <ReceiptField label="Item count" value={String(booking.items.length)} />
        </div>

        <ReceiptDivider />

        <div className="py-3">
          <p
            data-receipt-muted
            className="font-display text-[10px] font-bold uppercase tracking-wide text-[#64748b]"
          >
            Next steps
          </p>
          <ol className="font-body mt-2 space-y-2 text-[13px] leading-relaxed text-[#0f172a]">
            <li>1. Pack your items and go to {booking.stationName}</li>
            <li>2. Show this pre-booking receipt to staff at the counter</li>
            <li>
              3. Staff will give you a tracking receipt — send it to your recipient so they can
              track and collect
            </li>
          </ol>
        </div>

        <ReceiptDivider />

        <div className="flex flex-col items-center gap-1.5 py-4">
          <div className="flex h-9 items-end justify-center gap-px" aria-hidden>
            {code.split("").map((char, i) => (
              <div
                key={`${char}-${i}`}
                className="w-0.5 bg-[#0d9488]"
                style={{ height: `${20 + (char.charCodeAt(0) % 10)}px`, opacity: 0.75 }}
              />
            ))}
          </div>
          <p
            data-receipt-primary
            className="font-mono text-[11px] font-bold tracking-widest text-[#0d9488]"
          >
            {code}
          </p>
        </div>
      </div>

      <div data-receipt-footer className="bg-[#0d9488] py-3 text-center">
        <p className="font-display text-[11px] font-semibold text-white">
          Parcela · VIP &amp; STC only
        </p>
      </div>
    </div>
  );
}
