"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Hash, SearchX } from "lucide-react";
import { TrackHeaderIllustration } from "@/components/track/TrackHeaderIllustration";
import { TrackWizardSteps } from "@/components/track/TrackWizardSteps";
import { AppShell } from "@/components/ui/AppShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { lookupParcelAsync, normalizeTrackQuery } from "@/lib/tracking";
import { showErrorAlert } from "@/lib/sweetalert";

function TrackEntryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const linkError = searchParams.get("error") === "invalid-link";
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(
    linkError ? "This tracking link is invalid or expired." : null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (linkError) {
      void showErrorAlert({
        title: "Invalid tracking link",
        text: "Ask the sender for a new link or enter your pickup code manually.",
        confirmText: "OK",
      });
    }
  }, [linkError]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = normalizeTrackQuery(code);
    if (!normalized) {
      setError("Enter the pickup code from the sender's receipt");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const parcel = await lookupParcelAsync(normalized);
    if (!parcel) {
      void showErrorAlert({
        title: "Parcel not found",
        text: "Check the pickup code on your receipt and try again.",
        confirmText: "Try again",
      });
      setIsSubmitting(false);
      return;
    }

    router.push(`/track/status?code=${encodeURIComponent(parcel.pickupCode)}`);
  }

  const canSubmit = code.trim().length > 0 && !isSubmitting;

  return (
    <AppShell
      footer={
        <Button
          type="submit"
          form="track-entry-form"
          fullWidth
          disabled={!canSubmit}
          size="md"
          className="!min-h-11 !rounded-xl !text-sm"
        >
          {isSubmitting ? "Looking up..." : "Track parcel"}
        </Button>
      }
    >
      <header className="z-10 shrink-0 border-b border-border bg-surface px-4 pb-3 pt-2 sm:px-5">
        <Link
          href="/"
          className="font-display mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>

        <TrackHeaderIllustration />

        <div className="mt-2.5">
          <span className="font-display inline-block rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            Step 1 of 4
          </span>
          <h1 className="font-display mt-1.5 text-xl font-bold tracking-tight text-foreground">
            Track your parcel
          </h1>
          <p className="font-body mt-1 text-sm leading-snug text-muted">
            Enter the pickup code printed on the receipt the sender shared with you
          </p>
        </div>

        <div className="mt-3">
          <TrackWizardSteps current={1} />
        </div>
      </header>

      <section className="mobile-scroll min-h-0 flex-1 bg-background px-4 pt-4 pb-6 sm:px-5">
        <form id="track-entry-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="pickup-code"
              className="font-display mb-2 block text-xs font-semibold uppercase tracking-wide text-muted"
            >
              Pickup code on receipt
            </label>
            <div className="relative">
              <Hash className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <Input
                id="pickup-code"
                type="text"
                placeholder="e.g. PKP-XXXX or PCL-XXXX-XXXX"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                className="pl-11 font-mono uppercase tracking-wide"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-danger/20 bg-danger/5 px-3.5 py-3">
              <SearchX className="mt-0.5 size-4 shrink-0 text-danger" />
              <p className="font-body text-sm text-danger">{error}</p>
            </div>
          )}
        </form>
      </section>
    </AppShell>
  );
}

export function TrackEntryView() {
  return (
    <Suspense
      fallback={
        <AppShell viewport className="!px-0 !pt-0">
          <div className="animate-pulse px-5 py-4">
            <div className="h-4 w-12 rounded bg-border" />
          </div>
        </AppShell>
      }
    >
      <TrackEntryContent />
    </Suspense>
  );
}
