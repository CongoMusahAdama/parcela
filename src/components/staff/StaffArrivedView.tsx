"use client";

import { useMemo, useState } from "react";
import { Bell, Bus, CheckCircle2, Search } from "lucide-react";
import { StaffParcelsLoading } from "@/components/staff/StaffParcelsLoading";
import { StaffParcelDetailDrawer } from "@/components/staff/StaffParcelDetailDrawer";
import { StaffPageHeader } from "@/components/staff/StaffPageHeader";
import { useStaffSession } from "@/components/staff/StaffOperatorShell";
import { useStaffParcels } from "@/components/staff/StaffParcelsContext";
import { confirmBusArrivalApi } from "@/lib/staff-api";
import { runOrQueueStaffMutation } from "@/lib/staff-mutation-queue";
import { matchesStaffParcelQuery } from "@/lib/staff-parcel-filters";
import { getStaffFreezeMessage, loadOperatorLockStatus } from "@/lib/operator-controls";
import { showConfirmDialog, showSuccessAlert, showValidationAlert } from "@/lib/sweetalert";
import { toStaffParcelDetail } from "@/types/staff-parcel";
import type { StaffParcelSummary } from "@/types/staff-parcel";

type IncomingBusGroup = {
  busNumber: string;
  fromStation: string;
  toStation: string;
  parcelCount: number;
  updatedAt: string;
  parcels: StaffParcelSummary[];
};

function formatUpdated(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StaffArrivedView() {
  const { staff } = useStaffSession();
  const { parcels, loading, refresh } = useStaffParcels();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<StaffParcelSummary | null>(null);
  const [selectedBus, setSelectedBus] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const arrivedGroups = useMemo(() => {
    const incoming = parcels
      .filter((p) => p.status === "in_transit" && p.direction === "incoming")
      .filter((p) => matchesStaffParcelQuery(p, query))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const groups = new Map<string, IncomingBusGroup>();

    for (const parcel of incoming) {
      const busNumber = parcel.busNumber ?? "BUS-UNKNOWN";
      const existing = groups.get(busNumber);

      if (existing) {
        existing.parcels.push(parcel);
        existing.parcelCount += 1;
        if (new Date(parcel.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
          existing.updatedAt = parcel.updatedAt;
        }
      } else {
        groups.set(busNumber, {
          busNumber,
          fromStation: parcel.originStationName,
          toStation: parcel.destinationStationName,
          parcelCount: 1,
          updatedAt: parcel.updatedAt,
          parcels: [parcel],
        });
      }
    }

    return Array.from(groups.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [parcels, query]);

  const totalParcels = arrivedGroups.reduce((sum, group) => sum + group.parcelCount, 0);
  const selectedGroup =
    arrivedGroups.find((group) => group.busNumber === selectedBus) ?? arrivedGroups[0] ?? null;
  const detail = selected ? toStaffParcelDetail(selected) : null;

  async function handleConfirmArrival() {
    if (!selectedGroup) {
      await showValidationAlert({
        title: "Select a bus",
        text: "Choose an incoming bus before confirming arrival.",
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
      title: "Confirm bus arrival?",
      text: `Mark ${selectedGroup.busNumber} as arrived at ${staff.stationName}? ${selectedGroup.parcelCount} parcel${selectedGroup.parcelCount === 1 ? "" : "s"} will move to collection and recipients will be notified.`,
      confirmText: "Yes, confirm arrival",
      cancelText: "Not yet",
      icon: "warning",
    });

    if (!confirmed) return;

    setIsConfirming(true);
    try {
      const outcome = await runOrQueueStaffMutation({
        execute: () => confirmBusArrivalApi(selectedGroup.busNumber),
        queueWhenOffline: () => ({
          type: "confirm-arrival" as const,
          busNumber: selectedGroup.busNumber,
          label: `Confirm arrival ${selectedGroup.busNumber}`,
        }),
      });

      if (outcome.status === "queued") {
        await showSuccessAlert({
          title: "Queued — will sync when online",
          text: `Arrival for ${selectedGroup.busNumber} is saved on this device and will confirm when the connection returns. Recipient SMS will send after sync.`,
          confirmText: "OK",
        });
        return;
      }

      const result = outcome.data;
      const smsSent = result.sms.filter((item) => item.sent).length;
      await refresh();
      await showSuccessAlert({
        title: "Bus arrival confirmed",
        text: `${result.busNumber} received at ${staff.stationName}. ${result.parcelCount} parcel${result.parcelCount === 1 ? "" : "s"} moved to collection queue. ${smsSent} recipient SMS sent via mNotify.`,
        confirmText: "Done",
      });
    } catch (err) {
      await showValidationAlert({
        title: "Unable to confirm arrival",
        text: err instanceof Error ? err.message : "Please check the bus number and try again.",
      });
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <StaffPageHeader
        title="Arrived"
        description="Destination staff receive parcels from the driver by bus number, confirm the bus has arrived, then recipients can be alerted."
        badge={`${arrivedGroups.length} bus${arrivedGroups.length === 1 ? "" : "es"}`}
        meta={staff.stationName}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface px-4 py-3 shadow-sm">
          <p className="font-display text-[10px] font-bold uppercase tracking-wide text-muted">
            Incoming buses
          </p>
          <p className="font-display mt-1 text-2xl font-bold text-foreground">
            {arrivedGroups.length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface px-4 py-3 shadow-sm">
          <p className="font-display text-[10px] font-bold uppercase tracking-wide text-muted">
            Parcels on arrived buses
          </p>
          <p className="font-display mt-1 text-2xl font-bold text-foreground">{totalParcels}</p>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-violet-200/60 bg-violet-50/80 px-4 py-3.5">
        <p className="font-body text-sm leading-relaxed text-violet-900">
          <span className="font-semibold">Staff tip:</span> When the bus gets to your terminal,
          staff receive the parcels from the driver by <span className="font-semibold">bus number</span>.
          After confirming arrival, recipients on that bus can be alerted that their parcels are now
          at the station.
        </p>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search bus, origin, recipient, or reference…"
          className="font-body w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-4 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted focus:border-[var(--staff-accent)]"
        />
      </div>

      {loading ? (
        <StaffParcelsLoading message="Loading incoming buses…" />
      ) : arrivedGroups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center shadow-sm">
          <div
            className="mx-auto flex size-14 items-center justify-center rounded-2xl"
            style={{ background: "var(--staff-accent-muted)", color: "var(--staff-accent)" }}
          >
            <Bus className="size-7" strokeWidth={2.25} />
          </div>
          <p className="font-display mt-5 text-lg font-bold text-foreground">
            {query ? "No matching buses" : "No arrived buses"}
          </p>
          <p className="font-body mt-2 text-sm text-muted">
            {query
              ? "Try a different bus number, origin, or recipient."
              : "Incoming buses will appear here when they reach the terminal."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-border bg-surface p-4 shadow-sm lg:p-5">
            <p className="font-display text-xs font-bold uppercase tracking-wider text-muted">
              Incoming buses
            </p>
            <ul className="mt-4 space-y-3">
              {arrivedGroups.map((group) => {
                const active = selectedGroup?.busNumber === group.busNumber;
                return (
                  <li key={group.busNumber}>
                    <button
                      type="button"
                      onClick={() => setSelectedBus(group.busNumber)}
                      className={`w-full rounded-2xl border px-4 py-4 text-left transition-colors ${
                        active
                          ? "border-[var(--staff-accent)] bg-[var(--staff-accent-muted)]"
                          : "border-border bg-background hover:border-[var(--staff-accent)]/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-display text-base font-bold text-foreground">
                            {group.busNumber}
                          </p>
                          <p className="font-body mt-1 text-sm text-muted">
                            {group.fromStation} to {group.toStation}
                          </p>
                        </div>
                        <span className="rounded-full bg-violet-50 px-2 py-1 text-[10px] font-bold uppercase text-violet-800">
                          arrived
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
                        <span>{group.parcelCount} parcels</span>
                        <span>Updated {formatUpdated(group.updatedAt)}</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm lg:p-6">
            {!selectedGroup ? null : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-xs font-bold uppercase tracking-wider text-muted">
                      Bus arrival
                    </p>
                    <h2 className="font-display mt-2 text-2xl font-bold text-foreground">
                      {selectedGroup.busNumber}
                    </h2>
                    <p className="font-body mt-1 text-sm text-muted">
                      Received from <span className="font-semibold">{selectedGroup.fromStation}</span>{" "}
                      into <span className="font-semibold">{selectedGroup.toStation}</span>
                    </p>
                  </div>
                  <div className="rounded-xl bg-background px-4 py-3 text-right">
                    <p className="font-display text-[10px] font-bold uppercase tracking-wide text-muted">
                      Parcels on this bus
                    </p>
                    <p className="font-display mt-1 text-2xl font-bold text-foreground">
                      {selectedGroup.parcelCount}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-border bg-background p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl text-white"
                      style={{ background: "var(--staff-accent)" }}
                    >
                      <Bell className="size-5" />
                    </div>
                    <div>
                      <p className="font-display text-sm font-bold text-foreground">
                        Confirm arrival from driver
                      </p>
                      <p className="font-body mt-1 text-sm text-muted">
                        Once staff receive these parcels from the driver and confirm arrival,
                        recipients on this bus can be alerted that their parcels are now at the
                        terminal.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="font-display text-xs font-bold uppercase tracking-wider text-muted">
                      Parcels on {selectedGroup.busNumber}
                    </p>
                    <button
                      type="button"
                      disabled={isConfirming}
                      onClick={() => void handleConfirmArrival()}
                      className="font-display inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60"
                      style={{ background: "var(--staff-accent)" }}
                    >
                      <CheckCircle2 className="size-3.5" />
                      {isConfirming ? "Confirming…" : "Confirm arrival"}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {selectedGroup.parcels.map((parcel) => (
                      <div
                        key={parcel.bookingReference}
                        className="rounded-2xl border border-border bg-background px-4 py-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-mono text-sm font-bold text-foreground">
                              {parcel.bookingReference}
                            </p>
                            <p className="font-body mt-1 text-sm text-muted">
                              {parcel.recipientName} · {parcel.itemCount} item
                              {parcel.itemCount === 1 ? "" : "s"}
                            </p>
                            <p className="font-body mt-1 text-xs text-muted">
                              From {parcel.originStationName}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setSelected(parcel)}
                              className="font-display rounded-lg border border-border bg-surface px-3 py-2 text-[11px] font-semibold text-foreground hover:border-[var(--staff-accent)] hover:text-[var(--staff-accent)]"
                            >
                              View details
                            </button>
                            <a
                              href={`tel:${parcel.recipientPhone}`}
                              className="font-display rounded-lg border border-border bg-surface px-3 py-2 text-[11px] font-semibold text-foreground hover:border-[var(--staff-accent)] hover:text-[var(--staff-accent)]"
                            >
                              Contact recipient
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      <StaffParcelDetailDrawer parcel={detail} onClose={() => setSelected(null)} />
    </main>
  );
}
