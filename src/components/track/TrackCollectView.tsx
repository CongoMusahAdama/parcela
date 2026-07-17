"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, FileText, MapPin } from "lucide-react";
import { ParcelStatusTimeline } from "@/components/track/ParcelStatusTimeline";
import { PenaltyNotice } from "@/components/track/PenaltyNotice";
import { ParcelTransportInfo } from "@/components/track/ParcelTransportInfo";
import { TrackCollectIllustration } from "@/components/track/TrackCollectIllustration";
import { TrackNotFound } from "@/components/track/TrackNotFound";
import { TrackWizardSteps } from "@/components/track/TrackWizardSteps";
import { AppShell } from "@/components/ui/AppShell";
import { Button } from "@/components/ui/Button";
import { ScrollMoreHint } from "@/components/ui/ScrollMoreHint";
import { formatItemLabel } from "@/lib/bookingItems";
import { lookupParcelAsync, resolveStationCoords } from "@/lib/tracking";
import type { TrackedParcel } from "@/types/parcel";
import { cn } from "@/lib/utils";

function CollectLoadingShell() {
  return (
    <AppShell viewport className="!px-0 !pt-0">
      <div className="animate-pulse px-5 py-4">
        <div className="h-4 w-12 rounded bg-border" />
        <div className="mx-auto mt-4 h-[140px] max-w-[240px] rounded-xl bg-border" />
        <div className="mt-4 h-8 w-56 rounded bg-border" />
      </div>
    </AppShell>
  );
}

function TrackCollectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code") ?? "";
  const [parcel, setParcel] = useState<TrackedParcel | null | undefined>(undefined);

  const loadParcel = useCallback(
    (refresh = false) => {
      if (!code) {
        setParcel(null);
        return;
      }
      void lookupParcelAsync(code, { refresh }).then((result) => {
        if (!result) {
          setParcel(null);
          return;
        }

        const canCollect =
          result.status === "ready_for_collection" || result.status === "arrived";
        if (!canCollect && result.status !== "collected") {
          router.replace(`/track/status?code=${encodeURIComponent(result.pickupCode)}`);
          return;
        }

        setParcel(result);
      });
    },
    [code, router],
  );

  useEffect(() => {
    loadParcel(true);
    const onFocus = () => loadParcel(true);
    window.addEventListener("focus", onFocus);
    const interval = window.setInterval(() => loadParcel(true), 15_000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(interval);
    };
  }, [loadParcel]);

  if (parcel === undefined) {
    return <CollectLoadingShell />;
  }

  if (!code || !parcel) {
    return (
      <TrackNotFound message="This collection link is invalid or the parcel is no longer available." />
    );
  }

  const coords = resolveStationCoords(parcel);
  const isCollected = parcel.status === "collected";
  const canCollect = parcel.status === "ready_for_collection" || parcel.status === "arrived";

  return (
    <AppShell
      footer={
        isCollected ? (
          <Button
            href={`/track/status?code=${encodeURIComponent(parcel.pickupCode)}`}
            fullWidth
            className="!min-h-11 !text-sm"
          >
            View parcel status
          </Button>
        ) : undefined
      }
    >
      <header className="shrink-0 border-b border-border bg-surface px-5 pb-3 pt-2">
        <button
          type="button"
          onClick={() => router.push(`/track/status?code=${encodeURIComponent(parcel.pickupCode)}`)}
          className="font-display mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>

        <TrackCollectIllustration />

        <div className="mt-2">
          <span className="font-display inline-block rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            {isCollected ? "Complete" : "Step 4 of 4"}
          </span>
          <h1
            className={cn(
              "font-display mt-1.5 text-xl font-bold tracking-tight sm:text-2xl",
              isCollected ? "text-success" : "text-foreground",
            )}
          >
            {isCollected ? "Parcel collected" : "Ready to collect"}
          </h1>
          <p className="font-body mt-1 text-sm text-muted">
            {isCollected
              ? "This parcel has been handed over at the station. No further action is needed."
              : "Bring the receipt the sender sent you to the station counter."}
          </p>
        </div>

        <div className="mt-3">
          <TrackWizardSteps current={4} code={parcel.pickupCode} />
        </div>

        {canCollect ? (
          <div className="mt-3">
            <PenaltyNotice arrivedAt={parcel.arrivedAt} status={parcel.status} embedded />
          </div>
        ) : null}
      </header>

      <ScrollMoreHint scrollClassName="bg-background px-5 py-4 md:px-8">
        {isCollected ? (
          <div className="rounded-2xl border border-success/25 bg-success/5 p-4 text-center">
            <CheckCircle2 className="mx-auto size-8 text-success" />
            <p className="font-display mt-3 text-sm font-bold text-success">Handover complete</p>
            <p className="font-body mt-2 text-xs leading-relaxed text-muted">
              Tracking ID {parcel.pickupCode} was released to the recipient at{" "}
              {parcel.destinationStationName}.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center ring-1 ring-primary/10">
            <FileText className="mx-auto size-8 text-primary" />
            <p className="font-display mt-3 text-sm font-bold text-foreground">
              Sender&apos;s receipt
            </p>
            <p className="font-body mt-2 text-xs leading-relaxed text-muted">
              This is what you need at the counter. It shows the tracking ID for everything in this
              booking.
            </p>
            <p className="font-display mt-4 text-[10px] font-semibold uppercase tracking-wide text-muted">
              Tracking ID on receipt
            </p>
            <p className="font-mono mt-1 text-2xl font-bold tracking-wide text-primary">
              {parcel.pickupCode}
            </p>
          </div>
        )}

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

        <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <div className="flex gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MapPin className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[10px] font-semibold uppercase tracking-wide text-muted">
                {isCollected ? "Collected at" : "Collect at"}
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
              {!isCollected && coords ? (
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

        <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <p className="font-display mb-2 text-xs font-semibold text-foreground">
            Delivery progress
          </p>
          <ParcelStatusTimeline status={parcel.status} />
        </div>
      </ScrollMoreHint>
    </AppShell>
  );
}

export function TrackCollectView() {
  return (
    <Suspense fallback={<CollectLoadingShell />}>
      <TrackCollectContent />
    </Suspense>
  );
}
