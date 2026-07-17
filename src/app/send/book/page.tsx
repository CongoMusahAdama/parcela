"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronRight, MapPin } from "lucide-react";
import { AppShell } from "@/components/ui/AppShell";
import { Button } from "@/components/ui/Button";
import { BookHeaderIllustration } from "@/components/send/BookHeaderIllustration";
import { ParcelForm, type ParcelFormData, type ParcelFormHandle } from "@/components/send/ParcelForm";
import { SendWizardSteps } from "@/components/send/SendWizardSteps";
import { StationIcon } from "@/components/send/StationIcon";
import { submitBooking } from "@/lib/booking";
import { loadOperatorLockStatus } from "@/lib/operator-controls";
import { showValidationAlert } from "@/lib/sweetalert";
import type { Station } from "@/types/parcel";
import {
  ensureStationsLoaded,
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
    ensureStationsLoaded().then(setAllStations);
  }, []);

  const destinationStations = sortStationsAlphabetically(
    allStations.filter((s) => s.id !== originStation.id)
  );
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
      <header className="z-10 shrink-0 border-b border-border bg-surface px-5 pb-3 pt-2">
        <Link
          href="/send"
          className="font-display mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>

        <BookHeaderIllustration />

        <div className="mt-4">
          <span className="font-display inline-block rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            Step 2 of 3
          </span>
          <h1 className="font-display mt-2 text-2xl font-bold tracking-tight text-foreground">
            Parcel details
          </h1>
          <p className="font-body mt-1.5 text-sm text-muted">
            Complete each part — you can go back and edit anytime
          </p>
        </div>

        <div className="mt-4">
          <SendWizardSteps current={2} stationId={originStation.id} />
        </div>

        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-border bg-background px-3 py-2">
          <StationIcon operator={originStation.operator} className="size-9 rounded-lg" />
          <div className="min-w-0 flex-1">
            <p className="font-display truncate text-sm font-semibold text-foreground">
              {originStation.name}
            </p>
            <p className="font-body flex items-center gap-1 truncate text-xs text-muted">
              <MapPin className="size-3 shrink-0 text-primary" />
              {originStation.code} · {originStation.city}
            </p>
          </div>
          <Link
            href="/send"
            className="font-display shrink-0 text-xs font-semibold text-primary"
          >
            Change
          </Link>
        </div>
      </header>

      <div className="mobile-scroll min-h-0 flex-1 bg-background px-5 pt-2 pb-6 md:px-8 lg:px-10">
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
          <div className="animate-pulse shrink-0 border-b border-border bg-surface px-5 pb-4 pt-2">
            <div className="mb-3 h-4 w-12 rounded bg-border" />
            <div className="mx-auto h-[240px] w-full max-w-[380px] rounded-xl bg-border" />
            <div className="mt-4 space-y-2">
              <div className="h-5 w-24 rounded-full bg-border" />
              <div className="h-7 w-40 rounded bg-border" />
            </div>
          </div>
        </AppShell>
      }
    >
      <BookPageContent />
    </Suspense>
  );
}
