"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Bus,
  ChevronRight,
  Clock,
  MapPin,
  Navigation,
} from "lucide-react";
import { PenaltyNotice } from "@/components/track/PenaltyNotice";
import { TrackNotFound } from "@/components/track/TrackNotFound";
import { TrackWizardSteps } from "@/components/track/TrackWizardSteps";
import { stationDirectionsUrl } from "@/lib/maps";
import { operatorAccentColor } from "@/lib/operators";
import { lookupParcelAsync, resolveStationCoords } from "@/lib/tracking";
import type { TrackedParcel } from "@/types/parcel";

const CollectionStationMap = dynamic(
  () =>
    import("@/components/track/CollectionStationMap").then((m) => m.CollectionStationMap),
  {
    ssr: false,
    loading: () => <div className="h-full min-h-[320px] flex-1 animate-pulse bg-muted/20" />,
  }
);

const SHEET_HEIGHT = 280;

function TrackStationContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") ?? "";
  const [parcel, setParcel] = useState<TrackedParcel | null>(null);

  useEffect(() => {
    if (code) lookupParcelAsync(code).then((p) => setParcel(p ?? null));
  }, [code]);

  if (!code || !parcel) {
    return (
      <TrackNotFound message="We couldn't load the collection station for this parcel." />
    );
  }

  const coords = resolveStationCoords(parcel);
  if (!coords) {
    return (
      <TrackNotFound
        title="Station location unavailable"
        message="We don't have map coordinates for this station yet. Use the address on the status screen."
        backHref={`/track/status?code=${encodeURIComponent(parcel.pickupCode)}`}
        backLabel="Back to status"
      />
    );
  }

  const canCollect =
    parcel.status === "ready_for_collection" || parcel.status === "arrived";
  const accent = parcel.destinationOperator
    ? operatorAccentColor(parcel.destinationOperator)
    : "#0d9488";
  const directionsHref = stationDirectionsUrl(
    coords.lat,
    coords.lng,
    parcel.destinationStationName
  );

  return (
    <div className="relative mx-auto h-dvh max-h-dvh w-full max-w-[430px] overflow-hidden bg-background">
      <CollectionStationMap
        parcel={parcel}
        lat={coords.lat}
        lng={coords.lng}
        hideDirectionsButton
        bottomInset={SHEET_HEIGHT}
        topInset={88}
      />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 px-5 pt-3">
        <div className="pointer-events-auto flex items-center justify-between gap-3">
          <Link
            href={`/track/status?code=${encodeURIComponent(parcel.pickupCode)}`}
            className="font-display inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/95 px-3 py-2 text-sm font-semibold text-foreground shadow-md backdrop-blur-sm transition-colors hover:bg-surface"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
          <span className="font-display rounded-full bg-primary px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
            Step 3 of 4
          </span>
        </div>

        <div className="pointer-events-auto mt-3">
          <TrackWizardSteps current={3} code={parcel.pickupCode} />
        </div>
      </header>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[600] px-4 pb-4 md:px-6">
        <div className="pointer-events-auto rounded-2xl border border-border bg-surface/98 p-4 shadow-[0_-12px_40px_rgba(15,23,42,0.14)] backdrop-blur-md">
          <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-border" />

          <div className="flex items-start gap-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md"
              style={{ backgroundColor: accent }}
            >
              <Bus className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[10px] font-bold uppercase tracking-wide text-primary">
                Find the station
              </p>
              <p className="font-display text-base font-bold leading-snug text-foreground">
                {parcel.destinationStationName}
              </p>
              <p className="font-body mt-0.5 text-[11px] text-muted">
                {parcel.destinationOperator ?? "Station"} · Collect here
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-start gap-2 text-muted">
            <MapPin className="mt-0.5 size-3.5 shrink-0" />
            <p className="font-body text-xs leading-relaxed">
              {parcel.destinationStationAddress}
            </p>
          </div>

          <div className="mt-2 flex items-center gap-2 text-primary">
            <Clock className="size-3.5 shrink-0" />
            <p className="font-body text-xs font-medium">
              {parcel.destinationStationHours}
            </p>
          </div>

          <a
            href={directionsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(13,148,136,0.35)] transition-transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <Navigation className="size-4" />
            Open directions in Maps
          </a>

          {canCollect ? (
            <PenaltyNotice
              className="mt-3"
              arrivedAt={parcel.arrivedAt}
              status={parcel.status}
            />
          ) : null}

          {canCollect ? (
            <Link
              href={`/track/collect?code=${encodeURIComponent(parcel.pickupCode)}`}
              className="font-display mt-3 flex items-center justify-center gap-1 text-sm font-semibold text-primary"
            >
              Collection details
              <ChevronRight className="size-4" />
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function TrackStationView() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center bg-background">
          <p className="font-body text-sm text-muted">Loading map...</p>
        </div>
      }
    >
      <TrackStationContent />
    </Suspense>
  );
}
