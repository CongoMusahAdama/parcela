"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, Bus, Package, PackageCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLeadParcels } from "@/components/lead/LeadParcelsContext";
import { useLeadSession } from "@/components/lead/LeadOperatorShell";
import { computeStaffParcelStats } from "@/types/staff-parcel";

const STATUS_BADGE: Record<string, string> = {
  pending_dropoff: "bg-amber-50 text-amber-800",
  in_transit: "bg-sky-50 text-sky-800",
  arrived: "bg-violet-50 text-violet-800",
  ready_for_collection: "staff-status-ready",
  collected: "bg-slate-100 text-slate-700",
};

export function LeadAnalyticsView() {
  const { staff } = useLeadSession();
  const { parcels, loading } = useLeadParcels();

  const stats = useMemo(() => computeStaffParcelStats(parcels), [parcels]);
  const outgoing = parcels.filter((p) => p.direction === "outgoing").length;
  const incoming = parcels.filter((p) => p.direction === "incoming").length;
  const collected = parcels.filter((p) => p.status === "collected").length;

  const statusRows = [
    { key: "pending_dropoff", label: "Awaiting drop-off", value: stats.pendingDropoff },
    { key: "in_transit", label: "In transit", value: stats.inTransit },
    { key: "arrived", label: "Arrived at branch", value: stats.arrived },
    { key: "ready_for_collection", label: "Ready to collect", value: stats.readyForCollection },
    { key: "collected", label: "Collected", value: collected },
  ];

  return (
    <main className="operator-portal-main">
      <div className="mb-4 sm:mb-5">
        <h1 className="font-display text-lg font-bold text-foreground sm:text-2xl">Branch analytics</h1>
        <p className="font-body mt-0.5 text-xs text-muted sm:mt-1 sm:text-sm">
          Quick numbers for {staff.stationName}
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted sm:rounded-2xl sm:p-10">
          Loading branch numbers…
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-5">
          <section className="grid grid-cols-3 gap-2 sm:gap-3">
            <SnapshotCard label="Awaiting drop-off" value={stats.pendingDropoff} icon={Package} />
            <SnapshotCard label="Arrived at branch" value={stats.arrived} icon={Bus} />
            <SnapshotCard label="Collected" value={collected} icon={PackageCheck} />
          </section>

          <article className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm sm:rounded-2xl">
            <div className="border-b border-border px-3 py-3 sm:px-5 sm:py-4">
              <h2 className="font-display text-sm font-bold text-foreground sm:text-base">Today at a glance</h2>
              <p className="font-body mt-0.5 text-xs text-muted sm:text-sm">
                {stats.total} parcels · {outgoing} out · {incoming} in
              </p>
            </div>
            <div className="divide-y divide-border/60">
              {statusRows.map((row) => (
                <div
                  key={row.key}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4 sm:py-3"
                >
                  <span
                    className={`font-display inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase sm:px-2.5 sm:py-1 sm:text-[10px] ${
                      STATUS_BADGE[row.key] ?? STATUS_BADGE.collected
                    }`}
                  >
                    {row.label}
                  </span>
                  <span className="font-display text-base font-bold text-foreground sm:text-lg">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <Link
            href="/lead/reports"
            className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-3 shadow-sm transition-shadow hover:shadow-md sm:gap-3 sm:rounded-2xl sm:px-5 sm:py-4"
          >
            <div className="min-w-0">
              <p className="font-display text-sm font-bold text-foreground">Full report</p>
              <p className="font-body mt-0.5 hidden text-xs text-muted sm:block">
                Download PDF or Excel for your branch.
              </p>
            </div>
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-white sm:rounded-xl sm:px-3 sm:py-2 sm:text-xs"
              style={{ background: "var(--staff-accent)" }}
            >
              Reports
              <ArrowRight className="size-3.5" />
            </span>
          </Link>
        </div>
      )}
    </main>
  );
}

function SnapshotCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-surface p-2.5 text-center shadow-sm sm:flex-row sm:items-center sm:gap-3 sm:p-4 sm:text-left sm:rounded-2xl">
      <span
        className="flex size-8 items-center justify-center rounded-lg sm:size-10 sm:rounded-xl"
        style={{ background: "var(--staff-accent-muted)", color: "var(--staff-accent)" }}
      >
        <Icon className="size-4 sm:size-5" />
      </span>
      <div>
        <p className="font-display text-lg font-bold leading-none text-foreground sm:text-2xl">{value}</p>
        <p className="font-body mt-0.5 text-[10px] leading-tight text-muted sm:mt-1 sm:text-xs">{label}</p>
      </div>
    </div>
  );
}
