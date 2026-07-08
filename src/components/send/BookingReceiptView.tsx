"use client";

import { useCallback, useState } from "react";
import { ParcelTagReceipt } from "@/components/parcel/ParcelTagReceipt";
import { captureReceiptAsPng } from "@/lib/receiptExport";
import { resolveBookingOperator } from "@/lib/booking";
import { buildParcelTagFields } from "@/lib/parcel-tag";
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
            text: `Take this to ${booking.stationName} when you drop off. Staff will fill the parcel tag when you verify at the counter.`,
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
        text: `Take this to ${booking.stationName} when you drop off. Staff will fill the parcel tag when you verify at the counter.`,
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

type BookingReceiptCardProps = {
  booking: PreBooking;
};

export function BookingReceiptCard({ booking }: BookingReceiptCardProps) {
  const operator = resolveBookingOperator(booking);
  const tag = buildParcelTagFields({
    operator,
    bookingReference: booking.bookingReference,
    pickupCode: booking.pickupCode,
    loggedAt: booking.createdAt,
    senderName: booking.senderName,
    senderPhone: booking.senderPhone,
    recipientName: booking.recipientName,
    recipientPhone: booking.recipientPhone,
    originStationId: booking.stationId,
    destinationStationId: booking.destinationStationId,
    originStationName: booking.stationName,
    destinationStationName: booking.destinationStationName,
    originStationCode: booking.stationCode,
    items: booking.items,
    statusLabel: "Awaiting drop-off",
  });

  return (
    <ParcelTagReceipt
      id="booking-receipt"
      tag={tag}
      variant="pre-booking"
      className="receipt-card rounded-xl shadow-sm"
    />
  );
}
