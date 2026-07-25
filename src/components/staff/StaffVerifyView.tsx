"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Bus,
  CheckCircle2,
  ClipboardCheck,
  MapPin,
  Package,
  Phone,
  Search,
  User,
} from "lucide-react";
import { StaffParcelsLoading } from "@/components/staff/StaffParcelsLoading";
import { StaffPageHeader } from "@/components/staff/StaffPageHeader";
import {
  paymentStatusBadge,
  StaffPaymentFields,
  type ParcelPaymentWho,
} from "@/components/staff/StaffPaymentFields";
import { useStaffSession } from "@/components/staff/StaffOperatorShell";
import { useStaffParcels } from "@/components/staff/StaffParcelsContext";
import { StaffParcelTagFillModal, type StaffTagFillContext } from "@/components/staff/StaffParcelTagFillModal";
import { verifyAndLogParcelApi } from "@/lib/staff-api";
import { runOrQueueStaffMutation } from "@/lib/staff-mutation-queue";
import { matchesStaffParcelQuery } from "@/lib/staff-parcel-filters";
import { getStaffFreezeMessage, loadOperatorLockStatus } from "@/lib/operator-controls";
import { isSupportedOperator } from "@/lib/operators";
import { ensureStationsLoaded } from "@/lib/stations";
import { showConfirmDialog, showSuccessAlert, showValidationAlert } from "@/lib/sweetalert";
import { getPendingParcelsForVerify, toStaffParcelDetail } from "@/types/staff-parcel";
import { cn } from "@/lib/utils";

const GHANA_PHONE_PATTERN = /^(\+?233|0)?[2-9]\d{8}$/;

const DEMO_BUSES: Record<"VIP" | "STC", readonly string[]> = {
  VIP: ["VIP-4521", "VIP-3310", "VIP-2890"],
  STC: ["STC-1180", "STC-2045", "STC-0922"],
};

function getDemoBuses(operator: string): readonly string[] {
  if (isSupportedOperator(operator)) {
    return DEMO_BUSES[operator];
  }
  const code = operator.trim().toUpperCase();
  return [`${code}-001`, `${code}-002`, `${code}-003`];
}

export function StaffVerifyView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { staff } = useStaffSession();
  const { parcels, loading, refresh } = useStaffParcels();

  const pending = useMemo(
    () => getPendingParcelsForVerify(parcels, staff.stationId),
    [parcels, staff.stationId]
  );

  const [query, setQuery] = useState("");
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [busNumber, setBusNumber] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [driverName, setDriverName] = useState("");
  const [parcelMatches, setParcelMatches] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagFillContext, setTagFillContext] = useState<StaffTagFillContext | null>(null);
  const [refRefreshTried, setRefRefreshTried] = useState<string | null>(null);
  const [paymentWho, setPaymentWho] = useState<ParcelPaymentWho | "">("");
  const [markPaid, setMarkPaid] = useState(false);

  const filtered = useMemo(
    () => pending.filter((p) => matchesStaffParcelQuery(p, query)),
    [pending, query]
  );

  const selected = pending.find((p) => p.bookingReference === selectedRef) ?? null;
  const detail = selected ? toStaffParcelDetail(selected) : null;

  const buses = getDemoBuses(staff.operator);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (!ref) return;
    if (pending.some((p) => p.bookingReference === ref)) {
      setSelectedRef(ref);
      return;
    }
    // Walk-in create redirects here; refresh once if the new row is not yet in memory.
    if (refRefreshTried !== ref && !loading) {
      setRefRefreshTried(ref);
      void refresh();
    }
  }, [searchParams, pending, refresh, refRefreshTried, loading]);

  useEffect(() => {
    setParcelMatches(false);
    setBusNumber("");
    setDriverPhone("");
    setDriverName("");
    setPaymentWho(selected?.paymentWho ?? "");
    setMarkPaid(selected?.paymentStatus === "paid");
  }, [selectedRef, selected?.paymentWho, selected?.paymentStatus]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;

    if (!selected) {
      await showValidationAlert({
        title: "Select a booking",
        text: "Choose a parcel from the list before logging it to a bus.",
      });
      return;
    }

    if (!parcelMatches) {
      await showValidationAlert({
        title: "Confirm parcel match",
        text: "Tick the parcel match check before logging it to a bus.",
      });
      return;
    }

    if (!paymentWho) {
      await showValidationAlert({
        title: "Who pays?",
        text: "Choose whether the sender or the receiver pays before logging to a bus.",
      });
      return;
    }

    if (!busNumber.trim()) {
      await showValidationAlert({
        title: "Bus number required",
        text: "Enter the bus number this parcel is travelling on.",
      });
      return;
    }

    const normalizedDriverPhone = driverPhone.replace(/\s/g, "");
    if (!normalizedDriverPhone) {
      await showValidationAlert({
        title: "Driver phone required",
        text: "Enter the driver's mobile number so recipients can reach them in transit.",
      });
      return;
    }

    if (!GHANA_PHONE_PATTERN.test(normalizedDriverPhone)) {
      await showValidationAlert({
        title: "Invalid driver phone",
        text: "Enter a valid Ghana mobile number (e.g. 0244555666).",
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
      title: "Log parcel to bus?",
      text: `Log ${selected.bookingReference} on bus ${busNumber.trim().toUpperCase()} (driver ${normalizedDriverPhone}) and mark it in transit?`,
      confirmText: "Yes, log parcel",
      cancelText: "Review again",
      icon: "warning",
    });

    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      const loggedBus = busNumber.trim().toUpperCase();
      const trimmedDriverName = driverName.trim() || undefined;
      const body = {
        busNumber: loggedBus,
        driverPhone: normalizedDriverPhone,
        driverName: trimmedDriverName,
        paymentWho,
        markPaid: paymentWho === "sender" && markPaid,
      };
      const result = await runOrQueueStaffMutation({
        execute: () => verifyAndLogParcelApi(selected.bookingReference, body),
        queueWhenOffline: () => ({
          type: "verify-log" as const,
          reference: selected.bookingReference,
          body,
          label: `Verify & log ${selected.bookingReference}`,
        }),
      });

      if (result.status === "queued") {
        await showSuccessAlert({
          title: "Queued — will sync when online",
          text: `${selected.bookingReference} is saved on this device and will log to bus ${loggedBus} when the connection returns.`,
          confirmText: "OK",
        });
        setSelectedRef(null);
        setParcelMatches(false);
        setBusNumber("");
        setDriverPhone("");
        setDriverName("");
        return;
      }

      await refresh();
      const stations = await ensureStationsLoaded();
      const originStation = stations.find((s) => s.id === selected.originStationId);
      const destinationStation = stations.find((s) => s.id === selected.destinationStationId);

      setTagFillContext({
        bookingReference: selected.bookingReference,
        pickupCode: selected.pickupCode,
        senderName: selected.senderName,
        senderPhone: selected.senderPhone,
        recipientName: selected.recipientName,
        recipientPhone: selected.recipientPhone,
        originStationId: selected.originStationId,
        destinationStationId: selected.destinationStationId,
        originStationName: selected.originStationName,
        destinationStationName: selected.destinationStationName,
        originStationCode: selected.originStationCode ?? originStation?.code,
        destinationStationCode: selected.destinationStationCode ?? destinationStation?.code,
        originCity: originStation?.city,
        destinationCity: destinationStation?.city,
        items: detail?.items ?? selected.items ?? [],
        busNumber: loggedBus,
        driverPhone: normalizedDriverPhone,
        driverName: trimmedDriverName,
        loggedAt: new Date().toISOString(),
        operator: staff.operator,
      });
      setSelectedRef(null);
      setParcelMatches(false);
      setBusNumber("");
      setDriverPhone("");
      setDriverName("");
    } catch (err) {
      await showValidationAlert({
        title: "Unable to log parcel",
        text: err instanceof Error ? err.message : "Please check the details and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleTagFillDone() {
    setTagFillContext(null);
    router.push("/staff/in-transit");
  }

  return (
    <main className="operator-portal-main">
      {tagFillContext && (
        <StaffParcelTagFillModal context={tagFillContext} onDone={handleTagFillDone} />
      )}
      <StaffPageHeader
        title="Verify & log"
        description="Short counter flow: choose a booking, confirm the parcel matches, assign a bus, and log it."
        badge={`${pending.length} to verify`}
        meta={staff.stationName}
      />

      {loading ? (
        <StaffParcelsLoading message="Loading parcels awaiting verification…" />
      ) : (
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-border bg-surface p-4 shadow-sm lg:p-5">
          <p className="font-display text-xs font-bold uppercase tracking-wider text-muted">
            Step 1 · Find booking
          </p>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Reference or sender…"
              className="font-body w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[var(--staff-accent)]"
            />
          </div>

          <ul className="mt-4 max-h-[420px] space-y-2 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="rounded-xl border border-dashed border-border px-3 py-6 text-center">
                <p className="font-body text-xs text-muted">No awaiting parcels found.</p>
              </li>
            ) : (
              filtered.map((parcel) => {
                const active = parcel.bookingReference === selectedRef;
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
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-mono text-xs font-bold text-foreground">
                            {parcel.bookingReference}
                          </p>
                          <p className="font-body mt-1 text-xs text-muted">{parcel.senderName}</p>
                          <p className="font-body mt-0.5 text-[11px] text-muted">
                            → {parcel.destinationStationName}
                          </p>
                        </div>
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-700">
                          pending
                        </span>
                      </div>
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
                <ClipboardCheck className="size-7" strokeWidth={2.25} />
              </div>
              <p className="font-display mt-5 text-lg font-bold text-foreground">
                Select a booking
              </p>
              <p className="font-body mt-2 max-w-sm text-sm text-muted">
                Choose a parcel from the list or open this screen from Awaiting drop-off.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-[1.35fr_0.95fr]">
                <section className="rounded-2xl border border-border bg-background p-4">
                  <p className="font-display text-xs font-bold uppercase tracking-wider text-muted">
                    Step 2 · Quick verify
                  </p>
                  <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-lg font-bold text-foreground">
                        {selected.bookingReference}
                      </p>
                      <p className="font-mono text-xs text-muted">Pickup {selected.pickupCode}</p>
                    </div>
                    <span className="font-display rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-800">
                      Awaiting drop-off
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="flex gap-2">
                      <User className="mt-0.5 size-4 shrink-0 text-muted" />
                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted">Sender</p>
                        <p className="text-sm font-medium">{selected.senderName}</p>
                        <p className="font-mono text-[11px] text-muted">{selected.senderPhone}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <User className="mt-0.5 size-4 shrink-0 text-muted" />
                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted">Recipient</p>
                        <p className="text-sm font-medium">{selected.recipientName}</p>
                        <p className="font-mono text-[11px] text-muted">{selected.recipientPhone}</p>
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 flex items-center gap-1.5 text-sm text-muted">
                    <MapPin className="size-3.5" style={{ color: "var(--staff-accent)" }} />
                    {selected.originStationName} → {selected.destinationStationName}
                  </p>

                  <div className="mt-4 rounded-xl border border-border bg-surface px-3 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                      Item summary
                    </p>
                    <ul className="mt-2 space-y-2">
                        {detail.items?.map((item, index) => (
                        <li
                          key={`${selected.bookingReference}-item-${index}`}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Package className="size-4 shrink-0 text-muted" />
                          <span className="capitalize">{item.parcelType}</span>
                          <span className="text-muted">— {item.description}</span>
                          {item.fragile && (
                            <span className="ml-auto text-[10px] font-bold uppercase text-amber-600">
                              Fragile
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface px-3 py-3 has-[:checked]:border-[var(--staff-accent)] has-[:checked]:bg-[var(--staff-accent-muted)]">
                    <input
                      type="checkbox"
                      checked={parcelMatches}
                      onChange={() => setParcelMatches((prev) => !prev)}
                      className="mt-0.5 size-4 shrink-0 accent-[var(--staff-accent)]"
                    />
                    <span className="font-body text-sm text-foreground">
                      Parcel matches booking and has been received at the counter
                    </span>
                  </label>

                  <div className="mt-4 rounded-xl border border-border bg-surface px-3 py-3">
                    {selected.paymentStatus === "paid" ? (
                      <p
                        className={cn(
                          "font-display inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase",
                          paymentStatusBadge(selected).className,
                        )}
                      >
                        {paymentStatusBadge(selected).label}
                      </p>
                    ) : (
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
                    )}
                  </div>
                </section>

                <section className="rounded-2xl border border-border bg-background p-4">
                  <p className="font-display text-xs font-bold uppercase tracking-wider text-muted">
                    Step 3 · Bus & driver
                  </p>
                  <div className="mt-4">
                    <label
                      htmlFor="bus-number"
                      className="font-display mb-2 block text-[11px] font-semibold uppercase tracking-wide text-muted"
                    >
                      Bus number
                    </label>
                    <div className="relative">
                      <Bus
                        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
                        style={{ color: "var(--staff-accent)" }}
                      />
                      <input
                        id="bus-number"
                        value={busNumber}
                        onChange={(e) => setBusNumber(e.target.value)}
                        placeholder={staff.operator === "VIP" ? "e.g. VIP-4521" : "e.g. STC-1180"}
                        className="font-mono w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-3 text-sm uppercase outline-none focus:border-[var(--staff-accent)]"
                        list="bus-suggestions"
                      />
                      <datalist id="bus-suggestions">
                        {buses.map((bus) => (
                          <option key={bus} value={bus} />
                        ))}
                      </datalist>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {buses.map((bus) => (
                        <button
                          key={bus}
                          type="button"
                          onClick={() => setBusNumber(bus)}
                          className="font-mono rounded-lg border border-border px-2 py-1 text-[10px] font-semibold text-muted hover:border-[var(--staff-accent)] hover:text-[var(--staff-accent)]"
                        >
                          {bus}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label
                      htmlFor="driver-phone"
                      className="font-display mb-2 block text-[11px] font-semibold uppercase tracking-wide text-muted"
                    >
                      Driver phone <span className="text-[var(--staff-accent)]">*</span>
                    </label>
                    <div className="relative">
                      <Phone
                        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
                        style={{ color: "var(--staff-accent)" }}
                      />
                      <input
                        id="driver-phone"
                        type="tel"
                        inputMode="tel"
                        value={driverPhone}
                        onChange={(e) => setDriverPhone(e.target.value)}
                        placeholder="e.g. 0244555666"
                        className="font-mono w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-3 text-sm outline-none focus:border-[var(--staff-accent)]"
                        autoComplete="tel"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label
                      htmlFor="driver-name"
                      className="font-display mb-2 block text-[11px] font-semibold uppercase tracking-wide text-muted"
                    >
                      Driver name <span className="font-normal normal-case text-muted">(optional)</span>
                    </label>
                    <div className="relative">
                      <User
                        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                      />
                      <input
                        id="driver-name"
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                        placeholder="e.g. Kwame Mensah"
                        className="font-body w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-3 text-sm outline-none focus:border-[var(--staff-accent)]"
                        autoComplete="name"
                      />
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl border border-dashed border-border bg-surface px-3 py-3 text-xs text-muted">
                    Logging saves bus + driver contact, keeps the pickup code, and moves the parcel
                    into <span className="font-semibold text-foreground">In transit</span>.
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="font-display mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold uppercase tracking-wide text-white disabled:opacity-60"
                    style={{ background: "var(--staff-accent)" }}
                  >
                    <CheckCircle2 className="size-4" />
                    {isSubmitting ? "Logging…" : "Log parcel to bus"}
                  </button>
                </section>
              </div>
            </form>
          )}
        </section>
      </div>
      )}
    </main>
  );
}
