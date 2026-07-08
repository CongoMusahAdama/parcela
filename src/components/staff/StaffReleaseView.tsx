"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  CalendarDays,
  KeyRound,
  Package,
  Phone,
  Search,
  Signature,
  ShieldCheck,
  User,
} from "lucide-react";
import { StaffParcelsLoading } from "@/components/staff/StaffParcelsLoading";
import { StaffAuthField } from "@/components/staff/StaffAuthField";
import { StaffPageHeader } from "@/components/staff/StaffPageHeader";
import { StaffParcelDetailDrawer } from "@/components/staff/StaffParcelDetailDrawer";
import { useStaffSession } from "@/components/staff/StaffOperatorShell";
import { useStaffParcels } from "@/components/staff/StaffParcelsContext";
import { releaseParcelApi } from "@/lib/staff-api";
import { runOrQueueStaffMutation } from "@/lib/staff-mutation-queue";
import { matchesStaffParcelQuery } from "@/lib/staff-parcel-filters";
import { getStaffFreezeMessage, loadOperatorLockStatus } from "@/lib/operator-controls";
import { getCollectionQueueParcels } from "@/types/staff-parcel";
import { showConfirmDialog, showSuccessAlert, showValidationAlert } from "@/lib/sweetalert";
import { toStaffParcelDetail } from "@/types/staff-parcel";
import type { StaffParcelSummary } from "@/types/staff-parcel";
import { cn } from "@/lib/utils";

export function StaffReleaseView() {
  const { staff } = useStaffSession();
  const { parcels, loading, refresh } = useStaffParcels();
  const [query, setQuery] = useState("");
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [pickupCodeInput, setPickupCodeInput] = useState("");
  const [recipientPhoneInput, setRecipientPhoneInput] = useState("");
  const [signatureName, setSignatureName] = useState("");
  const [recipientPresent, setRecipientPresent] = useState(false);
  const [parcelHandedOver, setParcelHandedOver] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queue = useMemo(() => {
    return getCollectionQueueParcels(parcels)
      .filter((p) => matchesStaffParcelQuery(p, query))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [parcels, query]);

  const selected = queue.find((p) => p.bookingReference === selectedRef) ?? queue[0] ?? null;
  const detail = selected ? toStaffParcelDetail(selected) : null;
  const collectionDateTime = new Date().toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  useEffect(() => {
    setPickupCodeInput("");
    setRecipientPhoneInput(selected?.recipientPhone ?? "");
    setSignatureName(selected?.recipientName ?? "");
    setRecipientPresent(false);
    setParcelHandedOver(false);
  }, [selectedRef, selected?.recipientName, selected?.recipientPhone]);

  async function handleRelease(e: React.FormEvent) {
    e.preventDefault();

    if (!selected) {
      await showValidationAlert({
        title: "Select a parcel",
        text: "Choose a parcel from the collection queue before releasing it.",
      });
      return;
    }

    if (pickupCodeInput.trim().toUpperCase() !== selected.pickupCode.toUpperCase()) {
      await showValidationAlert({
        title: "Pickup code mismatch",
        text: "Enter the correct pickup code before releasing the parcel.",
      });
      return;
    }

    if (!recipientPhoneInput.trim()) {
      await showValidationAlert({
        title: "Recipient number required",
        text: "Capture the recipient phone number in the station handover record.",
      });
      return;
    }

    if (!signatureName.trim()) {
      await showValidationAlert({
        title: "Signature name required",
        text: "Enter the recipient signature or full name before releasing the parcel.",
      });
      return;
    }

    if (!recipientPresent || !parcelHandedOver) {
      await showValidationAlert({
        title: "Release not complete",
        text: "Confirm recipient presence and parcel handover before finishing pickup.",
      });
      return;
    }

    const locks = await loadOperatorLockStatus(staff.operator);
    if (locks.staffOpsLocked) {
      await showValidationAlert({
        title: "Operations frozen by HQ",
        text: getStaffFreezeMessage(staff.operator),
      });
      return;
    }

    const confirmed = await showConfirmDialog({
      title: "Release parcel to recipient?",
      text: `Hand over ${selected.bookingReference} to ${signatureName.trim()} after verifying pickup code ${selected.pickupCode}?`,
      confirmText: "Yes, release parcel",
      cancelText: "Review again",
      icon: "warning",
    });

    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      const pickupCode = pickupCodeInput.trim();
      const outcome = await runOrQueueStaffMutation({
        execute: () => releaseParcelApi(selected.bookingReference, pickupCode),
        queueWhenOffline: () => ({
          type: "release" as const,
          reference: selected.bookingReference,
          pickupCode,
          label: `Release ${selected.bookingReference}`,
        }),
      });

      if (outcome.status === "queued") {
        await showSuccessAlert({
          title: "Queued — will sync when online",
          text: `${selected.bookingReference} release is saved on this device and will sync when the connection returns.`,
          confirmText: "OK",
        });
        setPickupCodeInput("");
        setRecipientPhoneInput("");
        setSignatureName("");
        setRecipientPresent(false);
        setParcelHandedOver(false);
        return;
      }

      await refresh();
      await showSuccessAlert({
        title: "Parcel released",
        text: `${selected.bookingReference} has been handed over to ${selected.recipientName}.`,
        confirmText: "Done",
      });
      setPickupCodeInput("");
      setRecipientPhoneInput("");
      setSignatureName("");
      setRecipientPresent(false);
      setParcelHandedOver(false);
    } catch (err) {
      await showValidationAlert({
        title: "Unable to release parcel",
        text: err instanceof Error ? err.message : "Please check the pickup code and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <StaffPageHeader
        title="Recipient pickup"
        description="Final handover step. Find the parcel in the collection queue, verify the pickup code, then release it to the recipient."
        badge={`${queue.length} awaiting pickup`}
        meta={staff.stationName}
      />

      {loading ? (
        <StaffParcelsLoading message="Loading collection queue…" />
      ) : (
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-border bg-surface p-4 shadow-sm lg:p-5">
          <p className="font-display text-xs font-bold uppercase tracking-wider text-muted">
            Step 1 · Find parcel
          </p>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Reference, recipient, or code…"
              className="font-body w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[var(--staff-accent)]"
            />
          </div>

          <ul className="mt-4 max-h-[420px] space-y-2 overflow-y-auto">
            {queue.length === 0 ? (
              <li className="rounded-xl border border-dashed border-border px-3 py-6 text-center">
                <p className="font-body text-xs text-muted">No parcels ready for pickup.</p>
              </li>
            ) : (
              queue.map((parcel) => {
                const active = selected?.bookingReference === parcel.bookingReference;
                return (
                  <li key={parcel.bookingReference}>
                    <button
                      type="button"
                      onClick={() => setSelectedRef(parcel.bookingReference)}
                      className={cn(
                        "w-full rounded-xl border px-3 py-3 text-left transition-colors",
                        active
                          ? "border-[var(--staff-accent)] bg-[var(--staff-accent-muted)]"
                          : "border-border bg-background hover:border-[var(--staff-accent)]/40"
                      )}
                    >
                      <p className="font-mono text-xs font-bold text-foreground">
                        {parcel.bookingReference}
                      </p>
                      <p className="font-body mt-1 text-xs text-muted">{parcel.recipientName}</p>
                      <p className="font-mono mt-0.5 text-[11px] text-muted">{parcel.pickupCode}</p>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </aside>

        <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm lg:p-6">
          {!selected || !detail ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
              <div
                className="flex size-14 items-center justify-center rounded-2xl"
                style={{ background: "var(--staff-accent-muted)", color: "var(--staff-accent)" }}
              >
                <ShieldCheck className="size-7" strokeWidth={2.25} />
              </div>
              <p className="font-display mt-5 text-lg font-bold text-foreground">
                Select a parcel
              </p>
              <p className="font-body mt-2 max-w-sm text-sm text-muted">
                Choose a ready-for-collection parcel to verify the pickup code and release it.
              </p>
            </div>
          ) : (
            <form onSubmit={handleRelease} className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-[1.15fr_0.95fr]">
                <section className="rounded-2xl border border-border bg-background p-4">
                  <p className="font-display text-xs font-bold uppercase tracking-wider text-muted">
                    Step 2 · Check recipient
                  </p>
                  <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-lg font-bold text-foreground">
                        {selected.bookingReference}
                      </p>
                      <p className="font-mono text-xs text-muted">Pickup {selected.pickupCode}</p>
                    </div>
                    <span className="font-display staff-status-ready rounded-full px-2.5 py-1 text-[10px] font-bold uppercase">
                      Ready to collect
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="flex gap-2">
                      <User className="mt-0.5 size-4 shrink-0 text-muted" />
                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted">Recipient</p>
                        <p className="text-sm font-medium">{selected.recipientName}</p>
                        <p className="font-mono text-[11px] text-muted">{selected.recipientPhone}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Package className="mt-0.5 size-4 shrink-0 text-muted" />
                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted">Parcel</p>
                        <p className="text-sm font-medium">
                          {selected.itemCount} item{selected.itemCount === 1 ? "" : "s"}
                        </p>
                        <p className="text-[11px] text-muted">From {selected.originStationName}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDetails(true)}
                      className="font-display rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-foreground hover:border-[var(--staff-accent)] hover:text-[var(--staff-accent)]"
                    >
                      View parcel details
                    </button>
                    <a
                      href={`tel:${selected.recipientPhone}`}
                      className="font-display rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-foreground hover:border-[var(--staff-accent)] hover:text-[var(--staff-accent)]"
                    >
                      <Phone className="mr-1 inline size-3.5" />
                      Contact recipient
                    </a>
                  </div>

                  <div className="mt-4 rounded-xl border border-border bg-surface px-3 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                      Pickup code check
                    </p>
                    <div className="relative mt-2">
                      <KeyRound
                        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
                        style={{ color: "var(--staff-accent)" }}
                      />
                      <input
                        value={pickupCodeInput}
                        onChange={(e) => setPickupCodeInput(e.target.value.toUpperCase())}
                        placeholder="Enter recipient pickup code"
                        className="font-mono w-full rounded-xl border border-border bg-background py-3 pl-10 pr-3 text-sm uppercase outline-none focus:border-[var(--staff-accent)]"
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      Ask the recipient for the pickup code before handover.
                    </p>
                  </div>

                  <div className="mt-4 rounded-xl border border-border bg-surface px-3 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                      Station handover record
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Capture the same details staff would write in the station collection book.
                    </p>
                    <div className="mt-3 space-y-3">
                      <StaffAuthField
                        id="recipient-phone-record"
                        label="Recipient phone number"
                        value={recipientPhoneInput}
                        onChange={setRecipientPhoneInput}
                        placeholder="Enter number used at pickup"
                        icon={Phone}
                      />
                      <StaffAuthField
                        id="signature-name"
                        label="Signature / full name"
                        value={signatureName}
                        onChange={setSignatureName}
                        placeholder="Type recipient full name"
                        icon={Signature}
                      />
                      <div>
                        <label
                          htmlFor="collection-datetime"
                          className="staff-field-label mb-2 block text-muted"
                        >
                          Collection date & time
                        </label>
                        <div className="relative">
                          <CalendarDays className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-[#0D9488]" />
                          <input
                            id="collection-datetime"
                            type="text"
                            value={collectionDateTime}
                            readOnly
                            className="staff-field-input font-body w-full min-h-[52px] rounded-xl border border-border bg-background py-3 pl-12 pr-4 text-base text-foreground shadow-sm outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-border bg-background p-4">
                  <p className="font-display text-xs font-bold uppercase tracking-wider text-muted">
                    Step 3 · Release parcel
                  </p>

                  <div className="mt-4 space-y-3">
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface px-3 py-3 has-[:checked]:border-[var(--staff-accent)] has-[:checked]:bg-[var(--staff-accent-muted)]">
                      <input
                        type="checkbox"
                        checked={recipientPresent}
                        onChange={() => setRecipientPresent((prev) => !prev)}
                        className="mt-0.5 size-4 shrink-0 accent-[var(--staff-accent)]"
                      />
                      <span className="font-body text-sm text-foreground">
                        Recipient or authorized person is present at the counter
                      </span>
                    </label>

                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface px-3 py-3 has-[:checked]:border-[var(--staff-accent)] has-[:checked]:bg-[var(--staff-accent-muted)]">
                      <input
                        type="checkbox"
                        checked={parcelHandedOver}
                        onChange={() => setParcelHandedOver((prev) => !prev)}
                        className="mt-0.5 size-4 shrink-0 accent-[var(--staff-accent)]"
                      />
                      <span className="font-body text-sm text-foreground">
                        Parcel has been physically handed to the recipient
                      </span>
                    </label>
                  </div>

                  <div className="mt-5 rounded-xl border border-dashed border-border bg-surface px-3 py-3 text-xs text-muted">
                    Releasing this parcel will mark it as{" "}
                    <span className="font-semibold text-foreground">Collected</span> in the live
                    system and complete the delivery flow.
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="font-display mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold uppercase tracking-wide text-white disabled:opacity-60"
                    style={{ background: "var(--staff-accent)" }}
                  >
                    <CheckCircle2 className="size-4" />
                    {isSubmitting ? "Releasing…" : "Release parcel"}
                  </button>
                </section>
              </div>
            </form>
          )}
        </section>
      </div>
      )}

      <StaffParcelDetailDrawer
        parcel={showDetails ? detail : null}
        onClose={() => setShowDetails(false)}
        variant="modal"
      />
    </main>
  );
}
