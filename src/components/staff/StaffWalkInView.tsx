"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, MapPin, UserPlus } from "lucide-react";
import { ParcelForm, type ParcelFormData, type ParcelFormHandle } from "@/components/send/ParcelForm";
import { StationIcon } from "@/components/send/StationIcon";
import { StaffPageHeader } from "@/components/staff/StaffPageHeader";
import {
  StaffPaymentFields,
  type ParcelPaymentWho,
} from "@/components/staff/StaffPaymentFields";
import { useStaffSession } from "@/components/staff/StaffOperatorShell";
import { useStaffParcels } from "@/components/staff/StaffParcelsContext";
import { ApiError } from "@/lib/api-client";
import { submitBooking } from "@/lib/booking";
import { getStaffFreezeMessage, loadOperatorLockStatus } from "@/lib/operator-controls";
import { ensureOperatorBrandingLoaded } from "@/lib/operators";
import {
  ensureStationsLoaded,
  filterStationsByOperator,
  getStationById,
  resolveStationById,
  sortStationsAlphabetically,
} from "@/lib/stations";
import { showSuccessAlert, showValidationAlert } from "@/lib/sweetalert";
import type { Station } from "@/types/parcel";
import { Button } from "@/components/ui/Button";

const FORM_STEPS = 4;

export function StaffWalkInView() {
  const router = useRouter();
  const { staff } = useStaffSession();
  const { refresh } = useStaffParcels();
  const formRef = useRef<ParcelFormHandle>(null);

  const [formStep, setFormStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allStations, setAllStations] = useState<Station[]>([]);
  const [originStation, setOriginStation] = useState<Station | null | undefined>(undefined);
  const [paymentWho, setPaymentWho] = useState<ParcelPaymentWho | "">("");
  const [markPaid, setMarkPaid] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([ensureStationsLoaded(), ensureOperatorBrandingLoaded()]).then(([rows]) => {
      if (!cancelled) setAllStations(rows);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const cached = getStationById(staff.stationId);
    if (cached) {
      setOriginStation(cached);
      return;
    }
    void resolveStationById(staff.stationId).then((station) => {
      if (!cancelled) setOriginStation(station ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [staff.stationId]);

  const destinationStations = useMemo(() => {
    if (!originStation) return [];
    const network = filterStationsByOperator(allStations, originStation.operator);
    return sortStationsAlphabetically(network.filter((s) => s.id !== originStation.id));
  }, [allStations, originStation]);

  const isReviewStep = formStep === FORM_STEPS - 1;

  async function handleSubmit(data: ParcelFormData) {
    if (!originStation) return;

    if (!paymentWho) {
      await showValidationAlert({
        title: "Who pays?",
        text: "Choose whether the sender or the receiver pays before creating the booking.",
      });
      return;
    }

    const destination = getStationById(data.destinationStationId);
    if (!destination) {
      await showValidationAlert({
        title: "Destination required",
        text: "Choose where this parcel is going.",
      });
      return;
    }

    try {
      const locks = await loadOperatorLockStatus(staff.operator);
      if (locks.bookingsLocked) {
        await showValidationAlert({
          title: "Bookings frozen",
          text: getStaffFreezeMessage(staff.operator),
        });
        return;
      }
    } catch {
      // Booking API still enforces the freeze if lock status is unreachable.
    }

    setIsSubmitting(true);
    try {
      const booking = await submitBooking({
        stationId: originStation.id,
        destinationStationId: data.destinationStationId,
        senderName: data.senderName.trim(),
        senderPhone: data.senderPhone.trim(),
        recipientName: data.recipientName.trim(),
        recipientPhone: data.recipientPhone.trim(),
        items: data.items.map((item) => ({
          parcelType: item.parcelType,
          description: item.description.trim(),
          fragile: item.fragile,
        })),
        paymentWho,
        markPaid: paymentWho === "sender" && markPaid,
      });

      await refresh();
      await showSuccessAlert({
        title: "Walk-in booking created",
        text: `Reference ${booking.bookingReference}. Next: verify the parcel and log it to a bus.`,
        confirmText: "Verify & log",
      });
      router.push(`/staff/verify?ref=${encodeURIComponent(booking.bookingReference)}`);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Could not create the booking. Check the details and try again.";
      await showValidationAlert({
        title: "Booking failed",
        text: message,
      });
      setIsSubmitting(false);
    }
  }

  function handleContinue() {
    if (isReviewStep) return;
    formRef.current?.next();
  }

  function handleBack() {
    formRef.current?.back();
  }

  if (originStation === undefined) {
    return (
      <main className="operator-portal-main">
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-sm text-muted">
          Loading station…
        </div>
      </main>
    );
  }

  if (!originStation) {
    return (
      <main className="operator-portal-main">
        <StaffPageHeader
          title="New walk-in"
          description="Create a booking for a sender at your counter."
          meta={staff.stationName}
        />
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center shadow-sm">
          <p className="font-display text-lg font-bold text-foreground">Station not found</p>
          <p className="font-body mt-2 text-sm text-muted">
            Your account station could not be loaded. Contact your branch lead or Parcela support.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="operator-portal-main">
      <StaffPageHeader
        title="New walk-in"
        description="Sender is at the counter without an online booking. Create the record here, then verify and log the parcel to a bus."
        badge="Walk-in"
        meta={staff.stationName}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <p className="font-display text-xs font-bold uppercase tracking-wider text-muted">
              Drop-off station
            </p>
            <div className="mt-4 flex items-start gap-3">
              <StationIcon operator={originStation.operator} className="size-11 rounded-xl" />
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-bold leading-snug text-foreground">
                  {originStation.name}
                </p>
                <p className="font-body mt-1 flex items-center gap-1 text-xs text-muted">
                  <MapPin className="size-3 shrink-0" />
                  {originStation.city}
                </p>
              </div>
            </div>
            <span
              className="mt-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
              style={{ background: "var(--staff-accent)" }}
            >
              <UserPlus className="size-3" />
              Locked to your counter
            </span>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <StaffPaymentFields
              paymentWho={paymentWho}
              onPaymentWhoChange={(value) => {
                setPaymentWho(value);
                if (value !== "sender") setMarkPaid(false);
              }}
              markPaid={markPaid}
              onMarkPaidChange={setMarkPaid}
              showMarkPaid={paymentWho === "sender"}
              disabled={isSubmitting}
            />
          </section>

          <div className="rounded-2xl border border-amber-200/60 bg-amber-50/80 px-5 py-4">
            <p className="font-body text-sm leading-relaxed text-amber-900">
              <span className="font-semibold">Staff tip:</span> after you create the booking you go
              straight to Verify &amp; log to assign the bus and print the tag.
            </p>
          </div>
        </aside>

        <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
          <ParcelForm
            ref={formRef}
            step={formStep}
            onStepChange={setFormStep}
            originStation={originStation}
            destinationStations={destinationStations}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            density="comfortable"
          />

          <div className="mt-7 flex items-center justify-between gap-3 border-t border-border pt-5">
            {formStep > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="font-display text-sm font-medium text-muted transition-colors hover:text-foreground disabled:opacity-50"
              >
                Back
              </button>
            ) : (
              <span aria-hidden />
            )}

            {isReviewStep ? (
              <Button
                type="submit"
                form="parcel-form"
                variant="primary"
                size="md"
                disabled={isSubmitting}
                className="ml-auto !min-h-12 !rounded-xl !px-6 !text-sm"
                style={{ background: "var(--staff-accent)" }}
              >
                {isSubmitting ? "Creating…" : "Create & verify"}
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleContinue}
                disabled={isSubmitting}
                className="ml-auto !min-h-12 !rounded-xl !px-6 !text-sm"
                style={{ background: "var(--staff-accent)" }}
              >
                Continue
                <ChevronRight className="size-4" />
              </Button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
