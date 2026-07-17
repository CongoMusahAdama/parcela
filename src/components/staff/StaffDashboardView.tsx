"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bus,
  Layers,
  Package,
  PackageCheck,
  Truck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { OperatorLogo } from "@/components/brand/OperatorLogo";
import { StaffLiveClock } from "@/components/staff/StaffLiveClock";
import { StaffParcelsTable } from "@/components/staff/StaffParcelsTable";
import { useStaffSession } from "@/components/staff/StaffOperatorShell";
import { useStaffParcels } from "@/components/staff/StaffParcelsContext";
import { getOperatorWelcomeBg } from "@/lib/operators";
import { computeStaffParcelStats } from "@/types/staff-parcel";
import { cn } from "@/lib/utils";

type MetricCard = {
  label: string;
  shortLabel: string;
  value: string | number;
  icon: LucideIcon;
  href?: string;
  highlight?: boolean;
};

export function StaffDashboardView() {
  const { staff } = useStaffSession();
  const { parcels, loading, error } = useStaffParcels();
  const [activeTab, setActiveTab] = useState<"all" | "sent" | "received">("all");

  const sentParcels = useMemo(() => parcels.filter((p) => p.direction === "outgoing"), [parcels]);
  const receivedParcels = useMemo(() => parcels.filter((p) => p.direction === "incoming"), [parcels]);

  const tabConfig = {
    all: {
      label: "All parcels",
      shortLabel: "All",
      parcels,
      description: `Outgoing and incoming parcels for ${staff.stationName}.`,
    },
    sent: {
      label: "Parcels sent",
      shortLabel: "Sent",
      parcels: sentParcels,
      description: `Parcels your station has received from senders and logged out.`,
    },
    received: {
      label: "Parcels received",
      shortLabel: "Received",
      parcels: receivedParcels,
      description: `Parcels coming into ${staff.stationName} for recipient collection.`,
    },
  } as const;

  const currentTab = tabConfig[activeTab];
  const stats = computeStaffParcelStats(currentTab.parcels);

  const metricCards: MetricCard[] = [
    {
      label: "All parcels",
      shortLabel: "All",
      value: stats.total,
      icon: Layers,
      highlight: true,
    },
    {
      label: "Awaiting drop-off",
      shortLabel: "Drop-off",
      value: stats.pendingDropoff,
      icon: Package,
      href: "/staff/pending",
    },
    {
      label: "In transit",
      shortLabel: "Transit",
      value: stats.inTransit,
      icon: Truck,
      href: "/staff/in-transit",
    },
    {
      label: "Arrived",
      shortLabel: "Arrived",
      value: stats.arrived,
      icon: Bus,
      href: "/staff/arrived",
    },
    {
      label: "Ready to collect",
      shortLabel: "Collect",
      value: stats.readyForCollection,
      icon: PackageCheck,
      href: "/staff/collection",
    },
  ];

  return (
    <main className="operator-portal-main">
      <section className="relative min-h-[200px] overflow-hidden rounded-xl bg-[#0f172a] px-4 py-5 text-white shadow-md sm:min-h-[240px] sm:rounded-2xl sm:px-6 sm:py-7 md:min-h-[260px] lg:min-h-[320px] lg:px-8 lg:py-9">
        <div className="absolute inset-y-0 right-0 hidden w-[58%] items-end justify-end sm:flex md:w-[52%] lg:w-[48%]">
          <Image
            src={getOperatorWelcomeBg(staff.operator)}
            alt=""
            width={1200}
            height={800}
            priority
            className="h-full max-h-full w-auto max-w-full object-contain object-right-bottom"
          />
        </div>
        <div
          className="absolute inset-0 hidden sm:block"
          style={{
            background:
              "linear-gradient(90deg, rgb(15 23 42 / 0.95) 0%, rgb(15 23 42 / 0.72) 42%, rgb(15 23 42 / 0.2) 68%, transparent 100%)",
          }}
          aria-hidden
        />
        <div className="pointer-events-none absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
          <div className="rounded-xl bg-white/95 p-2 shadow-sm">
            <OperatorLogo operator={staff.operator} className="h-7 w-auto sm:h-8" />
          </div>
        </div>
        <div className="relative z-10 flex max-w-xl flex-col justify-end">
          <StaffLiveClock className="mb-3 sm:mb-4" />
          <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">
            Welcome, {staff.displayName.split(" ")[0]}
          </h1>
          <p className="font-body mt-1.5 max-w-md text-xs text-white/90 sm:mt-2 sm:text-sm">
            {staff.stationName} · Today&apos;s parcel overview for your terminal.
          </p>
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-border bg-surface p-3 shadow-sm sm:mt-5 sm:rounded-2xl sm:p-4">
        <div className="operator-portal-tabs -mx-1 px-1 pb-1 md:overflow-visible">
          <div className="inline-flex min-w-full gap-1 rounded-xl border border-border bg-background p-1 sm:min-w-max sm:rounded-2xl sm:p-1.5">
            {(Object.keys(tabConfig) as Array<keyof typeof tabConfig>).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "font-display flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-wide transition-all sm:flex-none sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-xs",
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
                <span className="md:hidden">{tabConfig[tab].shortLabel}</span>
                <span className="hidden md:inline">{tabConfig[tab].label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-5">
          {metricCards.map(({ label, shortLabel, value, icon: Icon, href, highlight }) => {
            const inner = (
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg sm:size-9"
                  style={{
                    background: highlight ? "var(--staff-accent)" : "var(--staff-accent-muted)",
                    color: highlight ? "#fff" : "var(--staff-accent)",
                  }}
                >
                  <Icon className="size-4" strokeWidth={2.25} />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-lg font-bold leading-none text-foreground sm:text-xl">
                    {value}
                  </p>
                  <p className="font-body mt-1 text-[10px] leading-tight text-muted sm:text-[11px]">
                    <span className="lg:hidden">{shortLabel}</span>
                    <span className="hidden lg:inline">{label}</span>
                  </p>
                </div>
              </div>
            );

            if (href) {
              return (
                <Link
                  key={label}
                  href={href}
                  className="group rounded-xl border border-border bg-surface px-2.5 py-2.5 shadow-sm transition-shadow hover:shadow-md sm:px-3"
                >
                  {inner}
                </Link>
              );
            }

            return (
              <div
                key={label}
                className="rounded-xl border border-border bg-surface px-2.5 py-2.5 shadow-sm sm:px-3"
                style={highlight ? { borderColor: "var(--staff-accent)", borderWidth: 1 } : undefined}
              >
                {inner}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-4 sm:mt-5">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div className="min-w-0">
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-foreground sm:text-sm">
              {currentTab.label}
            </h2>
            <p className="font-body mt-1 hidden text-sm text-muted sm:block">
              {currentTab.description}
            </p>
          </div>
          <p className="font-body shrink-0 text-xs text-muted">
            {loading ? "Loading parcels…" : `${currentTab.parcels.length} total`}
          </p>
        </div>
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:rounded-2xl">
            {error}
          </div>
        ) : loading ? (
          <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-muted sm:rounded-2xl sm:p-12">
            Loading station parcels…
          </div>
        ) : (
          <StaffParcelsTable parcels={currentTab.parcels} />
        )}
      </section>
    </main>
  );
}
