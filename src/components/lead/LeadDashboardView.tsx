"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bus,
  ExternalLink,
  Package,
  PackageCheck,
  Truck,
  UserPlus,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LeadAddStaffModal } from "@/components/lead/LeadAddStaffModal";
import { useLeadParcels } from "@/components/lead/LeadParcelsContext";
import { OperatorLogo } from "@/components/brand/OperatorLogo";
import { StaffLiveClock } from "@/components/staff/StaffLiveClock";
import { StaffParcelsTable } from "@/components/staff/StaffParcelsTable";
import { useLeadSession } from "@/components/lead/LeadOperatorShell";
import { getOperatorWelcomeBg } from "@/lib/operators";
import { computeBranchSummaryCounts } from "@/types/staff-parcel";
import { cn } from "@/lib/utils";

type QuickCard = {
  label: string;
  shortLabel: string;
  value: number;
  icon: LucideIcon;
};

type ParcelTab = "all" | "outgoing" | "incoming" | "collection";

const TAB_LABELS: Record<ParcelTab, { full: string; short: string }> = {
  all: { full: "All parcels", short: "All" },
  outgoing: { full: "Outgoing", short: "Out" },
  incoming: { full: "Incoming", short: "In" },
  collection: { full: "Awaiting collection", short: "Collect" },
};

export function LeadDashboardView() {
  const { staff } = useLeadSession();
  const { parcels, loading: parcelsLoading, error: parcelsError } = useLeadParcels();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ParcelTab>("all");

  const counts = useMemo(
    () => computeBranchSummaryCounts(parcels, staff.stationId),
    [parcels, staff.stationId],
  );

  const tabConfig = useMemo(
    () => ({
      all: {
        label: TAB_LABELS.all.full,
        parcels,
        description: `Outgoing and incoming parcels for ${staff.stationName}.`,
      },
      outgoing: {
        label: TAB_LABELS.outgoing.full,
        parcels: parcels.filter((parcel) => parcel.direction === "outgoing"),
        description: `Parcels logged from ${staff.stationName} and heading to other terminals.`,
      },
      incoming: {
        label: TAB_LABELS.incoming.full,
        parcels: parcels.filter((parcel) => parcel.direction === "incoming"),
        description: `Parcels arriving at ${staff.stationName} for recipient collection.`,
      },
      collection: {
        label: TAB_LABELS.collection.full,
        parcels: parcels.filter((parcel) =>
          ["arrived", "ready_for_collection"].includes(parcel.status),
        ),
        description: `Parcels at ${staff.stationName} waiting to be collected by recipients.`,
      },
    }),
    [parcels, staff.stationName],
  );

  const currentTab = tabConfig[activeTab];

  const metrics: QuickCard[] = [
    { label: "All parcels", shortLabel: "All", value: counts.total, icon: Package },
    {
      label: "Awaiting drop-off",
      shortLabel: "Drop-off",
      value: counts.pending_dropoff,
      icon: Package,
    },
    { label: "In transit", shortLabel: "Transit", value: counts.in_transit, icon: Truck },
    {
      label: "Ready to collect",
      shortLabel: "Collect",
      value: counts.ready_for_collection,
      icon: PackageCheck,
    },
    { label: "Collected today", shortLabel: "Collected", value: counts.updatedToday, icon: Bus },
  ];

  const heroIllustration = getOperatorWelcomeBg(staff.operator);

  return (
    <>
      <main className="operator-portal-main">
        <section className="overflow-hidden rounded-xl border border-border bg-white shadow-sm sm:rounded-2xl">
          <div className="flex flex-col md:flex-row md:items-stretch">
            <div className="relative flex flex-1 flex-col justify-end px-4 py-5 sm:px-6 sm:py-7 md:max-w-[55%] lg:max-w-[50%] lg:py-9">
              <div className="pointer-events-none absolute right-4 top-4 md:right-6 md:top-6">
                <div className="rounded-xl border border-border bg-white/95 p-2 shadow-sm">
                  <OperatorLogo operator={staff.operator} className="h-7 w-auto sm:h-8" />
                </div>
              </div>
              <StaffLiveClock variant="light" compact className="mb-3 md:mb-4" />
              <h1 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
                Hello, {staff.displayName.split(" ")[0]}
              </h1>
              <p className="font-body mt-1.5 text-xs text-muted sm:mt-2 sm:text-sm">
                {staff.stationName} · Branch overview and staff management.
              </p>
            </div>
            <div className="flex shrink-0 items-end justify-center border-t border-border/60 px-3 pb-4 pt-2 md:flex-1 md:justify-end md:border-t-0 md:border-l md:px-4 md:pb-0 md:pt-0 lg:pr-8">
              <Image
                src={heroIllustration}
                alt=""
                width={1200}
                height={800}
                priority
                unoptimized
                className="h-[130px] w-auto max-w-[min(88%,260px)] object-contain object-bottom sm:h-[160px] md:h-[min(240px,32vw)] lg:h-[min(320px,360px)] lg:max-w-[min(100%,420px)]"
              />
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-2 sm:mt-5 sm:gap-3 [grid-template-columns:repeat(auto-fit,minmax(7.5rem,1fr))]">
          {metrics.map(({ label, shortLabel, value, icon: Icon }) => (
            <div
              key={label}
              className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-surface p-2.5 shadow-sm sm:block sm:p-4"
            >
              <div
                className="flex size-7 shrink-0 items-center justify-center rounded-lg sm:mb-2 sm:size-8"
                style={{ background: "var(--staff-accent-muted)", color: "var(--staff-accent)" }}
              >
                <Icon className="size-3.5 sm:size-4" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-lg font-bold leading-none text-foreground sm:text-xl">
                  {parcelsLoading ? "—" : value}
                </p>
                <p className="font-body mt-0.5 truncate text-[10px] leading-tight text-muted sm:mt-1 sm:whitespace-normal sm:text-[11px]">
                  <span className="lg:hidden">{shortLabel}</span>
                  <span className="hidden lg:inline">{label}</span>
                </p>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3 lg:grid-cols-4">
          <Link
            href="/lead/team"
            className="flex min-w-0 flex-col items-center gap-1.5 rounded-xl border border-border bg-surface p-2.5 text-center shadow-sm md:rounded-2xl lg:flex-row lg:items-center lg:gap-3 lg:p-3.5 lg:text-left"
          >
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white sm:size-10 sm:rounded-xl"
              style={{ background: "var(--staff-accent)" }}
            >
              <Users className="size-4" />
            </span>
            <p className="font-display text-xs font-bold leading-snug text-foreground sm:text-sm">
              Manage staff
            </p>
          </Link>

          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="flex min-w-0 flex-col items-center gap-1.5 rounded-xl border border-border bg-surface p-2.5 text-center shadow-sm md:rounded-2xl lg:flex-row lg:items-center lg:gap-3 lg:p-3.5 lg:text-left"
          >
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white sm:size-10 sm:rounded-xl"
              style={{ background: "var(--staff-accent)" }}
            >
              <UserPlus className="size-4" />
            </span>
            <p className="font-display text-xs font-bold leading-snug text-foreground sm:text-sm">
              Add staff
            </p>
          </button>

          <Link
            href="/lead/analytics"
            className="flex min-w-0 flex-col items-center gap-1.5 rounded-xl border border-border bg-surface p-2.5 text-center shadow-sm md:rounded-2xl lg:flex-row lg:items-center lg:gap-3 lg:p-3.5 lg:text-left"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 sm:size-10 sm:rounded-xl">
              <Truck className="size-4" />
            </span>
            <p className="font-display text-xs font-bold leading-snug text-foreground sm:text-sm">
              Analytics
            </p>
          </Link>

          <a
            href="/staff/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-w-0 flex-col items-center gap-1.5 rounded-xl border border-dashed border-border bg-surface p-2.5 text-center shadow-sm md:rounded-2xl lg:flex-row lg:items-center lg:gap-3 lg:p-3.5 lg:text-left"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 sm:size-10 sm:rounded-xl">
              <ExternalLink className="size-4" />
            </span>
            <p className="font-display text-xs font-bold leading-snug text-foreground sm:text-sm">
              Counter
            </p>
          </a>
        </section>

        <section className="mt-4 sm:mt-5">
          <div className="mb-2.5 flex items-center justify-between gap-2 sm:mb-4 sm:items-end">
            <div className="min-w-0">
              <h2 className="font-display text-xs font-bold uppercase tracking-wider text-foreground sm:text-sm">
                Branch parcels
              </h2>
              <p className="font-body mt-0.5 hidden text-sm text-muted sm:block">
                {currentTab.description}
              </p>
            </div>
            <p className="font-body shrink-0 text-[11px] text-muted sm:text-xs">
              {parcelsLoading ? "Loading…" : `${currentTab.parcels.length} total`}
            </p>
          </div>

          <div className="operator-portal-tabs -mx-1 px-1 pb-1 md:overflow-visible">
            <div className="inline-flex min-w-full gap-1 rounded-xl border border-border bg-surface p-1 sm:min-w-max sm:rounded-2xl sm:p-1.5">
              {(Object.keys(tabConfig) as ParcelTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "font-display flex-1 whitespace-nowrap rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all sm:flex-none sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-xs lg:min-w-0",
                    activeTab === tab
                      ? "text-white shadow-md"
                      : "text-[var(--staff-accent-dark)] hover:bg-[var(--staff-accent-muted)] hover:text-[var(--staff-accent)]",
                  )}
                  style={
                    activeTab === tab
                      ? {
                          background: "var(--staff-accent)",
                          boxShadow: "0 8px 20px -12px rgba(15,23,42,0.45)",
                        }
                      : undefined
                  }
                >
                  <span className="md:hidden">{TAB_LABELS[tab].short}</span>
                  <span className="hidden md:inline">{TAB_LABELS[tab].full}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 sm:mt-4">
            {parcelsError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800 sm:rounded-2xl sm:px-4 sm:py-3">
                {parcelsError}
              </div>
            ) : parcelsLoading ? (
              <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted sm:rounded-2xl sm:p-12">
                Loading branch parcels…
              </div>
            ) : (
              <StaffParcelsTable parcels={currentTab.parcels} pageSize={5} />
            )}
          </div>
        </section>
      </main>

      <LeadAddStaffModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
    </>
  );
}
