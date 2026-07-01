"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronRight, Clock, MapPin, Package } from "lucide-react";
import { ParcelStatusTimeline } from "@/components/track/ParcelStatusTimeline";
import { ParcelTransportInfo } from "@/components/track/ParcelTransportInfo";
import { PenaltyNotice } from "@/components/track/PenaltyNotice";
import { TrackNotFound } from "@/components/track/TrackNotFound";
import { TrackMapIllustration } from "@/components/track/TrackMapIllustration";
import { TrackStatusIllustration } from "@/components/track/TrackStatusIllustration";
import { TrackWizardSteps } from "@/components/track/TrackWizardSteps";
import { AppShell } from "@/components/ui/AppShell";
import { Button } from "@/components/ui/Button";
import { ScrollMoreHint } from "@/components/ui/ScrollMoreHint";
import { lookupParcelAsync, resolveStationCoords, TRACK_STATUS_LABELS } from "@/lib/tracking";
import { formatExpectedArrival } from "@/lib/tracking-shared";
import { formatItemLabel } from "@/lib/bookingItems";
import type { TrackedParcel } from "@/types/parcel";
import { cn } from "@/lib/utils";

function formatUpdatedAt(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

function StatusLoadingShell() {
  return (
    <AppShell
      shellClassName="h-dvh max-h-dvh overflow-hidden"
      className="flex min-h-0 flex-1 flex-col overflow-hidden !px-0 !pb-0 !pt-0 bg-background"
    >
      <div className="animate-pulse shrink-0 border-b border-border bg-surface px-5 pb-3 pt-2">
        <div className="h-4 w-12 rounded bg-border" />
        <div className="mt-3 flex gap-3">
          <div className="h-[150px] w-[150px] shrink-0 rounded-xl bg-border" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-5 w-24 rounded-full bg-border" />
            <div className="h-6 w-32 rounded bg-border" />
          </div>
        </div>
      </div>
      <div className="animate-pulse shrink-0 px-5 py-3">
        <div className="h-40 rounded-xl bg-border" />
      </div>
    </AppShell>
  );
}

function TrackStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code") ?? "";
  const [parcel, setParcel] = useState<TrackedParcel | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!code) {
      setReady(true);
      return;
    }
    lookupParcelAsync(code).then((result) => {
      setParcel(result ?? null);
      setReady(true);
    });
  }, [code]);

  if (!ready) {
    return <StatusLoadingShell />;
  }

  if (!code || !parcel) {
    return (
      <TrackNotFound
        message="We couldn't find a parcel for this code. Check the pickup code on your receipt and try again."
      />
    );
  }

  const canCollect =
    parcel.status === "ready_for_collection" || parcel.status === "arrived";
  const coords = resolveStationCoords(parcel);

  return (
    <AppShell
      shellClassName="h-dvh max-h-dvh overflow-hidden"
      className="flex min-h-0 flex-1 flex-col overflow-hidden !px-0 !pb-0 !pt-0 bg-background"
      footer={
        canCollect ? (
          <Button
            href={`/track/collect?code=${encodeURIComponent(parcel.pickupCode)}`}
            fullWidth
            className="!min-h-11 !text-sm"
          >
            Collection details
            <ChevronRight className="size-4" />
          </Button>
        ) : coords ? (
          <Button
            href={`/track/station?code=${encodeURIComponent(parcel.pickupCode)}`}
            fullWidth
            className="!min-h-11 !text-sm"
          >
            <MapPin className="size-4" />
            Find station on map
          </Button>
        ) : undefined
      }
    >
      <header className="z-10 shrink-0 border-b border-border bg-surface px-5 pb-2.5 pt-2">
        <button
          type="button"
          onClick={() => router.push("/track")}
          className="font-display mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>

        <TrackStatusIllustration className="mb-3" />

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="font-display inline-block rounded-full bg-primary px-2 py-px text-[9px] font-bold uppercase tracking-wider text-white">
              Step 2 of 4
            </span>
            <h1 className="font-display mt-1 text-lg font-bold tracking-tight text-foreground">
              Parcel status
            </h1>
          </div>

          <div className="shrink-0 text-right">
            <p className="font-mono text-sm font-bold text-primary">{parcel.pickupCode}</p>
            <p
              className={cn(
                "font-display mt-0.5 text-[10px] font-bold uppercase tracking-wide",
                parcel.status === "ready_for_collection" ? "text-success" : "text-primary"
              )}
            >
              {TRACK_STATUS_LABELS[parcel.status]}
            </p>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2 rounded-lg bg-background px-2.5 py-1.5 text-[11px]">
          <span className="font-display min-w-0 flex-1 truncate font-semibold text-foreground">
            {parcel.originStationName}
          </span>
          <ArrowRight className="size-3.5 shrink-0 text-primary" aria-hidden />
          <span className="font-display min-w-0 flex-1 truncate text-right font-semibold text-foreground">
            {parcel.destinationStationName}
          </span>
        </div>

        <div className="mt-2.5">
          <TrackWizardSteps current={2} code={parcel.pickupCode} />
        </div>

        {coords ? (
          <Link
            href={`/track/station?code=${encodeURIComponent(parcel.pickupCode)}`}
            className="mt-3 flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 p-3 transition-colors hover:bg-primary/10"
          >
            <TrackMapIllustration size={52} />
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-bold text-primary">Find station on map</p>
              <p className="font-body truncate text-xs text-muted">
                {parcel.destinationStationName}
              </p>
            </div>
            <ChevronRight className="size-5 shrink-0 text-primary" />
          </Link>
        ) : null}
      </header>

      {canCollect ? (
        <section className="shrink-0 border-b border-border bg-background px-5 py-3 md:px-8">
          <PenaltyNotice
            arrivedAt={parcel.arrivedAt}
            status={parcel.status}
            embedded
          />
        </section>
      ) : null}

      <section className="shrink-0 border-b border-border bg-background px-5 py-2">
        <ParcelTransportInfo parcel={parcel} compact />
      </section>

      <section className="shrink-0 border-b border-border bg-background px-5 py-3">
        <p className="font-display mb-2 text-xs font-semibold text-foreground">Timeline</p>
        <div className="rounded-2xl border border-border bg-surface px-4 py-3 shadow-[var(--shadow-soft)]">
          <ParcelStatusTimeline status={parcel.status} />
        </div>
        <p className="font-body mt-2 text-center text-[10px] text-muted">
          Updated {formatUpdatedAt(parcel.updatedAt)}
        </p>
      </section>

      <ScrollMoreHint scrollClassName="px-5 py-3 md:px-8">
        <div className="rounded-xl border border-border bg-surface p-3 md:p-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="font-body inline-flex items-center gap-1">
              <Package className="size-3.5 text-primary" />
              {parcel.itemCount} item{parcel.itemCount !== 1 ? "s" : ""} · one tracking ID
            </span>
            <span className="font-body">Recipient: {parcel.recipientName}</span>
            <span className="font-body">Phone: {parcel.recipientPhoneMasked}</span>
          </div>
          <ul className="font-body mt-2 space-y-1.5 text-sm text-foreground">
            {parcel.items.map((item, index) => (
              <li key={item.id}>{formatItemLabel(item, index)}</li>
            ))}
          </ul>
          {parcel.expectedArrival &&
            (parcel.status === "in_transit" || parcel.status === "pending_dropoff") && (
              <p className="font-body mt-2 flex items-center gap-1.5 text-[11px] text-muted">
                <Clock className="size-3.5 text-primary" />
                Expected arrival {formatExpectedArrival(parcel.expectedArrival)}
              </p>
            )}
        </div>

        {canCollect && (
          <div className="mt-3 rounded-xl border border-success/25 bg-success/5 px-3 py-2.5">
            <p className="font-display text-xs font-bold text-foreground">Ready at the station</p>
            <p className="font-body mt-0.5 text-[11px] leading-relaxed text-muted">
              Bring the receipt the sender sent you — tracking ID{" "}
              <span className="font-mono font-semibold text-primary">{parcel.pickupCode}</span>.
            </p>
          </div>
        )}

        <div className="mt-3 rounded-xl border border-primary/15 bg-primary/5 p-3 md:p-4">
          <div className="flex gap-2.5">
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="font-display text-[10px] font-semibold uppercase tracking-wide text-muted">
                Collect at
              </p>
              <p className="font-display text-sm font-bold text-foreground">
                {parcel.destinationStationName}
              </p>
              <p className="font-body mt-0.5 text-xs text-muted">
                {parcel.destinationStationAddress}
              </p>
              <p className="font-body mt-0.5 text-xs font-medium text-primary">
                {parcel.destinationStationHours}
              </p>
            </div>
          </div>
        </div>
      </ScrollMoreHint>
    </AppShell>
  );
}

export function TrackStatusView() {
  return (
    <Suspense fallback={<StatusLoadingShell />}>
      <TrackStatusContent />
    </Suspense>
  );
}
