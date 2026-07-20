"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronRight, MapPin } from "lucide-react";
import { AppShell } from "@/components/ui/AppShell";
import { Button } from "@/components/ui/Button";
import { ParcelForm, type ParcelFormData, type ParcelFormHandle } from "@/components/send/ParcelForm";
import { StationIcon } from "@/components/send/StationIcon";
import { submitBooking } from "@/lib/booking";
import { loadOperatorLockStatus } from "@/lib/operator-controls";
import { ensureOperatorBrandingLoaded } from "@/lib/operators";
import { showValidationAlert } from "@/lib/sweetalert";
import type { Station } from "@/types/parcel";
import {
  ensureStationsLoaded,
  filterStationsByOperator,
  getStationById,
  resolveStationById,
  sortStationsAlphabetically,
} from "@/lib/stations";

const FORM_STEPS = 4;

function BookPageForm({ originStation }: { originStation: NonNullable<ReturnType<typeof getStationById>> }) {
  const router = useRouter();
  const formRef = useRef<ParcelFormHandle>(null);
  const [formStep, setFormStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allStations, setAllStations] = useState<Station[]>([]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([ensureStationsLoaded(), ensureOperatorBrandingLoaded()]).then(([rows]) => {
      if (!cancelled) setAllStations(rows);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Same transport network as the sender drop-off — every other branch.
  const destinationStations = useMemo(() => {
    const network = filterStationsByOperator(allStations, originStation.operator);
    return sortStationsAlphabetically(network.filter((s) => s.id !== originStation.id));
  }, [allStations, originStation.id, originStation.operator]);
  const isReviewStep = formStep === FORM_STEPS - 1;

  async function handleSubmit(data: ParcelFormData) {
    const destination = getStationById(data.destinationStationId);
    if (!destination) return;

    try {
      const locks = await loadOperatorLockStatus(originStation.operator);
      if (locks.bookingsLocked) {
        await showValidationAlert({
          title: "Bookings temporarily frozen",
          text: `${originStation.operator} HQ has paused new public bookings. Please try again later.`,
        });
        return;
      }
    } catch {
      // If lock status is unreachable, let the booking API enforce the freeze.
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
      });
      router.push(`/send/confirm?ref=${booking.bookingReference}`);
    } catch {
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

  return (
    <AppShell
      className="bg-background"
      footer={
        <div className="flex items-center justify-between gap-3">
          {formStep > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              className="font-display text-sm font-medium text-muted transition-colors hover:text-foreground"
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
              className="ml-auto !min-h-11 !rounded-xl !px-5 !text-sm"
            >
              {isSubmitting ? "Creating..." : "Get reference"}
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleContinue}
              className="ml-auto !min-h-11 !rounded-xl !px-5 !text-sm"
            >
              Continue
              <ChevronRight className="size-4" />
            </Button>
          )}
        </div>
      }
    >
      <header className="z-10 shrink-0 border-b border-border bg-surface px-4 pb-2.5 pt-2">
        <div className="flex items-center gap-2">
          <Link
            href="/send"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-primary hover:bg-primary/10"
            aria-label="Back to stations"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[10px] font-bold uppercase tracking-wider text-primary">
              Step 2 of 3 · Details
            </p>
            <h1 className="font-display truncate text-base font-bold tracking-tight text-foreground">
              {formStep === 0
                ? "Sender details"
                : formStep === 1
                  ? "Recipient details"
                  : formStep === 2
                    ? "Parcel info"
                    : "Review & confirm"}
            </h1>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5">
          <StationIcon operator={originStation.operator} className="size-7 rounded-md" />
          <div className="min-w-0 flex-1">
            <p className="font-display truncate text-[13px] font-semibold leading-tight text-foreground">
              {originStation.name}
            </p>
            <p className="font-body flex items-center gap-1 truncate text-[11px] text-muted">
              <MapPin className="size-2.5 shrink-0 text-primary" />
              {originStation.city}
            </p>
          </div>
          <Link href="/send" className="font-display shrink-0 text-[11px] font-semibold text-primary">
            Change
          </Link>
        </div>
      </header>

      <div className="mobile-scroll min-h-0 flex-1 bg-background px-4 pt-2.5 pb-4">
        <ParcelForm
          ref={formRef}
          step={formStep}
          onStepChange={setFormStep}
          originStation={originStation}
          destinationStations={destinationStations}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </AppShell>
  );
}

function BookPageContent() {
  const searchParams = useSearchParams();
  const stationId = searchParams.get("station") ?? "";
  const [originStation, setOriginStation] = useState<
    NonNullable<ReturnType<typeof getStationById>> | null | undefined
  >(undefined);

  useEffect(() => {
    if (!stationId) {
      setOriginStation(null);
      return;
    }
    const cached = getStationById(stationId);
    if (cached) {
      setOriginStation(cached);
      return;
    }
    resolveStationById(stationId).then((station) => setOriginStation(station ?? null));
  }, [stationId]);

  if (originStation === undefined) {
    return (
      <AppShell viewport className="!px-0 !pt-0">
        <div className="animate-pulse px-5 py-4">
          <div className="h-4 w-12 rounded bg-border" />
          <div className="mx-auto mt-3 h-[200px] rounded-xl bg-border" />
        </div>
      </AppShell>
    );
  }

  if (!originStation) {
    return (
      <AppShell>
        <Link
          href="/send"
          className="font-display mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
        <h1 className="font-display text-2xl font-bold text-foreground">Station not found</h1>
        <p className="font-body mt-2 text-sm text-muted">
          Please go back and select a valid station.
        </p>
        <Button href="/send" className="mt-6" fullWidth>
          Back to stations
        </Button>
      </AppShell>
    );
  }

  return <BookPageForm originStation={originStation} />;
}

export default function BookPage() {
  return (
    <Suspense
      fallback={
        <AppShell viewport className="!px-0 !pt-0">
          <div className="animate-pulse shrink-0 border-b border-border bg-surface px-4 pb-2.5 pt-2">
            <div className="mb-2 h-9 w-full rounded-lg bg-border" />
            <div className="h-10 w-full rounded-lg bg-border" />
          </div>
        </AppShell>
      }
    >
      <BookPageContent />
    </Suspense>
  );
}
