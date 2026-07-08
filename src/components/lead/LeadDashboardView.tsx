"use client";

import { useEffect, useMemo, useState } from "react";
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
import { fetchLeadSummary } from "@/lib/lead-api";
import { OPERATOR_CONFIRMED_ILLUSTRATION } from "@/lib/operators";
import type { BranchSummary } from "@/types/lead";

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
  const { staff, token } = useLeadSession();
  const { parcels, loading: parcelsLoading, error: parcelsError } = useLeadParcels();
  const [summary, setSummary] = useState<BranchSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ParcelTab>("all");

  useEffect(() => {
    void fetchLeadSummary(token)
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [token]);

  const counts = summary?.counts;

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
    { label: "All parcels", shortLabel: "All", value: counts?.total ?? 0, icon: Package },
    {
      label: "Awaiting drop-off",
      shortLabel: "Drop-off",
      value: counts?.pending_dropoff ?? 0,
      icon: Package,
    },
    { label: "In transit", shortLabel: "Transit", value: counts?.in_transit ?? 0, icon: Truck },
    {
      label: "Ready to collect",
      shortLabel: "Collect",
      value: counts?.ready_for_collection ?? 0,
      icon: PackageCheck,
    },
    { label: "Collected today", shortLabel: "Collected", value: counts?.collected ?? 0, icon: Bus },
  ];

  return (
    <>
      <main className="px-3 py-3 sm:px-6 sm:py-5 lg:px-8 lg:py-8">
        {/* Welcome hero */}
        <section className="overflow-hidden rounded-xl border border-border bg-white shadow-sm sm:relative sm:min-h-[380px] sm:rounded-2xl lg:min-h-[420px]">
          {/* Mobile: stacked greeting + mascot */}
          <div className="sm:hidden">
            <div className="relative z-20 px-3.5 pt-3.5 pb-2">
              <StaffLiveClock variant="light" compact className="mb-2" />
              <h1 className="font-display text-xl font-bold tracking-tight text-foreground">
                Hello, {staff.displayName.split(" ")[0]}
              </h1>
              <p className="font-body mt-1 text-xs text-muted">
                {staff.stationName} · Branch overview
              </p>
            </div>
            <div className="flex justify-center px-2 pb-3">
              <Image
                src={OPERATOR_CONFIRMED_ILLUSTRATION[staff.operator]}
                alt=""
                width={1200}
                height={800}
                priority
                unoptimized
                className="h-[140px] w-auto max-w-[min(88%,280px)] object-contain object-bottom"
              />
            </div>
          </div>

          {/* Desktop: mascot centred in the banner */}
          <div className="pointer-events-none absolute inset-0 z-10 hidden items-end justify-center sm:flex">
            <Image
              src={OPERATOR_CONFIRMED_ILLUSTRATION[staff.operator]}
              alt=""
              width={1200}
              height={800}
              priority
              unoptimized
              className="h-[min(92%,400px)] w-auto max-w-[min(70%,460px)] object-contain object-bottom lg:h-[min(98%,440px)] lg:max-w-[min(68%,500px)]"
            />
          </div>
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-[8] hidden w-[50%] sm:block"
            style={{
              background:
                "linear-gradient(90deg, rgb(255 255 255 / 1) 0%, rgb(255 255 255 / 0.96) 58%, transparent 100%)",
            }}
            aria-hidden
          />
          <div className="pointer-events-none absolute right-4 top-4 z-[12] hidden sm:block sm:right-8 sm:top-8">
            <div className="rounded-xl border border-border bg-white/95 p-2 shadow-sm">
              <OperatorLogo operator={staff.operator} className="h-8 w-auto" />
            </div>
          </div>
          <div className="relative z-20 hidden min-h-[380px] max-w-[52%] flex-col justify-end px-8 py-10 sm:flex lg:min-h-[420px]">
            <StaffLiveClock variant="light" className="mb-4" />
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
              Hello, {staff.displayName.split(" ")[0]}
            </h1>
            <p className="font-body mt-2 text-sm text-muted">
              {staff.stationName} · Branch overview and staff management.
            </p>
          </div>
        </section>

        {/* Metric snapshot */}
        <section className="mt-3 grid grid-cols-2 gap-2 sm:mt-5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
          {metrics.map(({ label, shortLabel, value, icon: Icon }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface p-2.5 shadow-sm sm:block sm:p-4"
            >
              <div
                className="flex size-7 shrink-0 items-center justify-center rounded-lg sm:mb-2 sm:size-8"
                style={{ background: "var(--staff-accent-muted)", color: "var(--staff-accent)" }}
              >
                <Icon className="size-3.5 sm:size-4" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-lg font-bold leading-none text-foreground sm:text-xl">
                  {loading ? "—" : value}
                </p>
                <p className="font-body mt-0.5 truncate text-[10px] leading-tight text-muted sm:mt-1 sm:whitespace-normal sm:text-[11px]">
                  <span className="sm:hidden">{shortLabel}</span>
                  <span className="hidden sm:inline">{label}</span>
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* Quick actions */}
        <section className="mt-3 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3 lg:grid-cols-4">
          <Link
            href="/lead/team"
            className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-surface p-2.5 text-center shadow-sm sm:flex-row sm:items-center sm:gap-3 sm:p-3.5 sm:text-left lg:rounded-2xl"
          >
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white sm:size-10 sm:rounded-xl"
              style={{ background: "var(--staff-accent)" }}
            >
              <Users className="size-4" />
            </span>
            <p className="font-display text-[11px] font-bold leading-tight text-foreground sm:text-sm">
              Manage staff
            </p>
          </Link>

          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-surface p-2.5 text-center shadow-sm sm:flex-row sm:items-center sm:gap-3 sm:p-3.5 sm:text-left lg:rounded-2xl"
          >
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white sm:size-10 sm:rounded-xl"
              style={{ background: "var(--staff-accent)" }}
            >
              <UserPlus className="size-4" />
            </span>
            <p className="font-display text-[11px] font-bold leading-tight text-foreground sm:text-sm">
              Add staff
            </p>
          </button>

          <Link
            href="/lead/analytics"
            className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-surface p-2.5 text-center shadow-sm sm:flex-row sm:items-center sm:gap-3 sm:p-3.5 sm:text-left lg:rounded-2xl"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 sm:size-10 sm:rounded-xl">
              <Truck className="size-4" />
            </span>
            <p className="font-display text-[11px] font-bold leading-tight text-foreground sm:text-sm">
              Analytics
            </p>
          </Link>

          <a
            href="/staff/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-border bg-surface p-2.5 text-center shadow-sm sm:flex-row sm:items-center sm:gap-3 sm:p-3.5 sm:text-left lg:rounded-2xl"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 sm:size-10 sm:rounded-xl">
              <ExternalLink className="size-4" />
            </span>
            <p className="font-display text-[11px] font-bold leading-tight text-foreground sm:text-sm">
              Counter
            </p>
          </a>
        </section>

        {/* Branch parcels */}
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

          <div className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
            <div className="inline-flex min-w-full gap-1 rounded-xl border border-border bg-surface p-1 sm:min-w-max sm:rounded-2xl sm:p-1.5">
              {(Object.keys(tabConfig) as ParcelTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`font-display flex-1 rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all sm:flex-none sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-xs ${
                    activeTab === tab
                      ? "text-white shadow-md"
                      : "text-[var(--staff-accent-dark)] hover:bg-[var(--staff-accent-muted)] hover:text-[var(--staff-accent)]"
                  }`}
                  style={
                    activeTab === tab
                      ? {
                          background: "var(--staff-accent)",
                          boxShadow: "0 8px 20px -12px rgba(15,23,42,0.45)",
                        }
                      : undefined
                  }
                >
                  <span className="sm:hidden">{TAB_LABELS[tab].short}</span>
                  <span className="hidden sm:inline">{TAB_LABELS[tab].full}</span>
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
