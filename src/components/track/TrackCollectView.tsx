"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, FileText, MapPin } from "lucide-react";
import { PenaltyNotice } from "@/components/track/PenaltyNotice";
import { ParcelTransportInfo } from "@/components/track/ParcelTransportInfo";
import { TrackCollectIllustration } from "@/components/track/TrackCollectIllustration";
import { TrackNotFound } from "@/components/track/TrackNotFound";
import { TrackWizardSteps } from "@/components/track/TrackWizardSteps";
import { AppShell } from "@/components/ui/AppShell";
import { ScrollMoreHint } from "@/components/ui/ScrollMoreHint";
import { formatItemLabel } from "@/lib/bookingItems";
import { lookupParcelAsync, lookupParcelByTokenAsync } from "@/lib/tracking";
import type { TrackedParcel } from "@/types/parcel";

function TrackCollectContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") ?? "";
  const [parcel, setParcel] = useState<TrackedParcel | null>(null);

  useEffect(() => {
    if (code) lookupParcelAsync(code).then((p) => setParcel(p ?? null));
  }, [code]);

  if (!code || !parcel) {
    return (
      <TrackNotFound message="This collection link is invalid or the parcel is no longer available." />
    );
  }

  const coords = resolveStationCoords(parcel);
  const canCollect =
    parcel.status === "ready_for_collection" || parcel.status === "arrived";

  return (
    <AppShell
      shellClassName="h-dvh max-h-dvh overflow-hidden"
      className="flex min-h-0 flex-1 flex-col overflow-hidden !px-0 !pb-0 !pt-0"
    >
      <header className="shrink-0 border-b border-border bg-surface px-5 pb-4 pt-2">
        <Link
          href={`/track/station?code=${encodeURIComponent(parcel.pickupCode)}`}
          className="font-display mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>

        <TrackCollectIllustration />

        <div className="mt-3">
          <span className="font-display inline-block rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            Step 4 of 4
          </span>
          <h1 className="font-display mt-2 text-2xl font-bold tracking-tight text-foreground">
            Collect your parcel
          </h1>
          <p className="font-body mt-1.5 text-sm text-muted">
            Bring the receipt the sender sent you — it has the tracking ID
          </p>
        </div>

        <div className="mt-4">
          <TrackWizardSteps current={4} code={parcel.pickupCode} />
        </div>

        {canCollect ? (
          <div className="mt-4">
            <PenaltyNotice
              arrivedAt={parcel.arrivedAt}
              status={parcel.status}
              embedded
            />
          </div>
        ) : null}
      </header>

      <ScrollMoreHint scrollClassName="bg-background px-5 py-5 md:px-8">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center ring-1 ring-primary/10">
          <FileText className="mx-auto size-8 text-primary" />
          <p className="font-display mt-3 text-sm font-bold text-foreground">
            Sender&apos;s receipt
          </p>
          <p className="font-body mt-2 text-xs leading-relaxed text-muted">
            Bring the receipt the sender shared with you. Staff will use the tracking ID on it to
            release your parcel{parcel.itemCount !== 1 ? "s" : ""}.
          </p>
          <p className="font-display mt-4 text-[10px] font-semibold uppercase tracking-wide text-muted">
            Tracking ID on receipt
          </p>
          <p className="font-mono mt-1 text-2xl font-bold tracking-wide text-primary">
            {parcel.pickupCode}
          </p>
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <p className="font-display text-sm font-bold text-foreground">
            {parcel.itemCount} item{parcel.itemCount !== 1 ? "s" : ""} on this ID
          </p>
          <ul className="font-body mt-2 space-y-1.5 text-sm text-foreground">
            {parcel.items.map((item, index) => (
              <li key={item.id}>{formatItemLabel(item, index)}</li>
            ))}
          </ul>
        </div>

        <div className="mt-4">
          <ParcelTransportInfo parcel={parcel} compact />
        </div>

        <div className="mt-5 rounded-2xl border border-border bg-surface p-4">
          <div className="flex gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MapPin className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[10px] font-semibold uppercase tracking-wide text-muted">
                Collect at
              </p>
              <p className="font-display text-sm font-bold text-foreground">
                {parcel.destinationStationName}
              </p>
              <p className="font-body mt-1 text-xs leading-relaxed text-muted">
                {parcel.destinationStationAddress}
              </p>
              <p className="font-body mt-1 text-xs font-medium text-primary">
                {parcel.destinationStationHours}
              </p>
              <p className="font-body mt-2 text-xs text-foreground">
                Recipient: {parcel.recipientName} · {parcel.recipientPhoneMasked}
              </p>
              {coords ? (
                <Link
                  href={`/track/station?code=${encodeURIComponent(parcel.pickupCode)}`}
                  className="font-display mt-2 inline-flex text-xs font-semibold text-primary"
                >
                  Open station map →
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </ScrollMoreHint>
    </AppShell>
  );
}

export function TrackCollectView() {
  return (
    <Suspense
      fallback={
        <AppShell shellClassName="h-dvh max-h-dvh overflow-hidden" className="!px-0 !pt-0">
          <div className="animate-pulse px-5 py-4">
            <div className="h-4 w-12 rounded bg-border" />
            <div className="mt-4 h-8 w-56 rounded bg-border" />
          </div>
        </AppShell>
      }
    >
      <TrackCollectContent />
    </Suspense>
  );
}
