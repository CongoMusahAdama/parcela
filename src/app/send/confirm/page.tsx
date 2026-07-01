"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { AppShell } from "@/components/ui/AppShell";
import { Button } from "@/components/ui/Button";
import { BookingReceiptCard, usePrintReceipt, useSaveReceipt } from "@/components/send/BookingReceiptView";
import { DropOffReminder } from "@/components/send/DropOffReminder";
import { ConfirmHeaderIllustration } from "@/components/send/ConfirmHeaderIllustration";
import { SendWizardSteps } from "@/components/send/SendWizardSteps";
import { fetchPreBookingByReference } from "@/lib/booking";
import { showSuccessAlert } from "@/lib/sweetalert";
import type { PreBooking } from "@/types/parcel";

function ConfirmSuccess({ booking }: { booking: PreBooking }) {
  const { saving, save } = useSaveReceipt(booking);
  const { printing, print } = usePrintReceipt();

  useEffect(() => {
    const key = `parcela-booking-alert-${booking.bookingReference}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    const itemLabel =
      booking.items.length === 1 ? "1 item" : `${booking.items.length} items`;

    void showSuccessAlert({
      title: "Booking confirmed!",
      text: `Tracking ID ${booking.pickupCode} covers all ${itemLabel}. Show your receipt at ${booking.stationName}.`,
      confirmText: "Great",
    });
  }, [booking]);

  return (
    <AppShell
      shellClassName="h-dvh max-h-dvh overflow-hidden"
      className="flex min-h-0 flex-1 flex-col overflow-hidden !px-0 !pb-0 !pt-0 bg-surface"
      footer={
        <div className="no-print space-y-2">
          <p className="font-body text-center text-xs leading-relaxed text-muted">
            Save your receipt — you must show it to staff at the counter
          </p>
          <Button
            type="button"
            variant="primary"
            fullWidth
            disabled={saving}
            onClick={save}
            className="!min-h-10 !text-sm"
          >
            <Download className="size-4" />
            {saving ? "Saving..." : "Save receipt as image"}
          </Button>
          <Button
            type="button"
            variant="outline"
            fullWidth
            disabled={printing}
            onClick={print}
            className="!min-h-10 !text-sm"
          >
            <Printer className="size-4" />
            {printing ? "Preparing..." : "Print receipt"}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button href="/" variant="outline" className="!min-h-10 !text-sm">
              Done
            </Button>
            <Button href="/send" variant="ghost" className="!min-h-10 !text-sm">
              Send again
            </Button>
          </div>
        </div>
      }
    >
      <div className="shrink-0 px-5 pt-2 pb-3 no-print">
        <Link
          href={`/send/book?station=${booking.stationId}`}
          className="font-display inline-flex items-center gap-1.5 text-sm font-medium text-primary"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>

        <ConfirmHeaderIllustration />

        <div className="mt-3 flex items-center justify-between gap-3">
          <div>
            <span className="font-display inline-block rounded-full bg-primary px-2 py-px text-[9px] font-bold uppercase tracking-wider text-white">
              Step 3 of 3
            </span>
            <h1 className="font-display mt-1 text-lg font-bold text-foreground">Booking created</h1>
          </div>
        </div>

        <div className="mt-3">
          <SendWizardSteps
            current={3}
            stationId={booking.stationId}
            confirmRef={booking.bookingReference}
          />
        </div>

        <div className="mt-3">
          <DropOffReminder stationName={booking.stationName} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-border">
        <BookingReceiptCard booking={booking} />
      </div>
    </AppShell>
  );
}

function ConfirmPageContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") ?? "";
  const [booking, setBooking] = useState<PreBooking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ref) {
      setLoading(false);
      return;
    }
    fetchPreBookingByReference(ref).then((b) => {
      setBooking(b ?? null);
      setLoading(false);
    });
  }, [ref]);

  if (loading) {
    return (
      <AppShell shellClassName="h-dvh max-h-dvh overflow-hidden" className="!px-0 !pt-0">
        <div className="animate-pulse px-5 py-4">
          <div className="h-4 w-12 rounded bg-border" />
          <div className="mx-auto mt-3 h-[130px] rounded-xl bg-border" />
          <div className="mt-4 h-40 rounded bg-border" />
        </div>
      </AppShell>
    );
  }

  if (!ref || !booking) {
    return (
      <AppShell>
        <Link
          href="/send"
          className="font-display mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
        <h1 className="font-display text-2xl font-bold text-foreground">Booking not found</h1>
        <p className="font-body mt-2 text-sm text-muted">
          We couldn&apos;t find this booking. It may have expired from your session.
        </p>
        <Button href="/send" className="mt-6" fullWidth>
          Start a new booking
        </Button>
      </AppShell>
    );
  }

  return <ConfirmSuccess booking={booking} />;
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <AppShell shellClassName="h-dvh max-h-dvh overflow-hidden" className="!px-0 !pt-0">
          <div className="animate-pulse px-5 py-4">
            <div className="h-4 w-12 rounded bg-border" />
            <div className="mx-auto mt-3 h-[130px] rounded-xl bg-border" />
            <div className="mt-4 h-40 rounded bg-border" />
          </div>
        </AppShell>
      }
    >
      <ConfirmPageContent />
    </Suspense>
  );
}
