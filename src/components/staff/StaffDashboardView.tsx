"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
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

type MetricCard = {
  label: string;
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
      parcels,
      description: `Outgoing and incoming parcels for ${staff.stationName}.`,
    },
    sent: {
      label: "Parcels sent",
      parcels: sentParcels,
      description: `Parcels your station has received from senders and logged out.`,
    },
    received: {
      label: "Parcels received",
      parcels: receivedParcels,
      description: `Parcels coming into ${staff.stationName} for recipient collection.`,
    },
  } as const;

  const currentTab = tabConfig[activeTab];
  const stats = computeStaffParcelStats(currentTab.parcels);

  const metricCards: MetricCard[] = [
    {
      label: "All parcels",
      value: stats.total,
      icon: Layers,
      highlight: true,
    },
    {
      label: "Awaiting drop-off",
      value: stats.pendingDropoff,
      icon: Package,
      href: "/staff/pending",
    },
    {
      label: "In transit",
      value: stats.inTransit,
      icon: Truck,
      href: "/staff/in-transit",
    },
    {
      label: "Arrived",
      value: stats.arrived,
      icon: Bus,
      href: "/staff/arrived",
    },
    {
      label: "Ready to collect",
      value: stats.readyForCollection,
      icon: PackageCheck,
      href: "/staff/collection",
    },
  ];

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="sticky top-0 z-30 -mx-4 bg-[#eef2f6] px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <section className="relative min-h-[220px] overflow-hidden rounded-2xl px-5 py-6 text-white shadow-md sm:min-h-[320px] sm:px-8 sm:py-10 lg:min-h-[420px]">
        <div className="absolute inset-y-0 right-0 flex w-[72%] items-start justify-end sm:w-[68%] lg:w-[62%]">
          <Image
            src={getOperatorWelcomeBg(staff.operator)}
            alt=""
            width={1200}
            height={800}
            priority
            className="h-full w-auto max-w-none object-contain object-right-top"
          />
        </div>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgb(0 0 0 / 0.82) 0%, rgb(0 0 0 / 0.5) 32%, rgb(0 0 0 / 0.08) 58%, transparent 100%), linear-gradient(180deg, transparent 60%, rgb(0 0 0 / 0.2) 100%)",
          }}
          aria-hidden
        />
        <div className="pointer-events-none absolute right-5 top-5 z-10 sm:right-8 sm:top-8">
          <div className="rounded-xl bg-white/95 p-2 shadow-sm">
            <OperatorLogo operator={staff.operator} className="h-8 w-auto" />
          </div>
        </div>
        <div className="relative z-10 flex min-h-[160px] flex-col justify-end pr-2 sm:min-h-[240px] sm:pr-8 lg:min-h-[320px] lg:max-w-[48%]">
          <StaffLiveClock className="mb-4" />
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome, {staff.displayName.split(" ")[0]}
          </h1>
          <p className="font-body mt-2 max-w-lg text-sm text-white/90">
            {staff.stationName} · Today&apos;s parcel overview for your terminal.
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <div className="inline-flex flex-wrap gap-1 rounded-2xl border border-border bg-background p-1.5">
          {(Object.keys(tabConfig) as Array<keyof typeof tabConfig>).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`font-display rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition-all ${
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
              {tabConfig[tab].label}
            </button>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {metricCards.map(({ label, value, icon: Icon, href, highlight }) => {
            const inner = (
              <div className="flex items-center gap-3">
                <div
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: highlight ? "var(--staff-accent)" : "var(--staff-accent-muted)",
                    color: highlight ? "#fff" : "var(--staff-accent)",
                  }}
                >
                  <Icon className="size-4" strokeWidth={2.25} />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-xl font-bold leading-none text-foreground">{value}</p>
                  <p className="font-body mt-1 text-[11px] leading-tight text-muted">{label}</p>
                </div>
              </div>
            );

            if (href) {
              return (
                <Link
                  key={label}
                  href={href}
                  className="group rounded-xl border border-border bg-surface px-3 py-2.5 shadow-sm transition-shadow hover:shadow-md"
                >
                  {inner}
                </Link>
              );
            }

            return (
              <div
                key={label}
                className="rounded-xl border border-border bg-surface px-3 py-2.5 shadow-sm"
                style={highlight ? { borderColor: "var(--staff-accent)", borderWidth: 1 } : undefined}
              >
                {inner}
              </div>
            );
          })}
        </div>
      </section>
      </div>

      <section className="mt-3">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
              {currentTab.label}
            </h2>
            <p className="font-body mt-1 text-sm text-muted">
              {currentTab.description}
            </p>
          </div>
          <p className="font-body text-xs text-muted">
            {loading ? "Loading parcels…" : `${currentTab.parcels.length} total`}
          </p>
        </div>
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : loading ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-sm text-muted">
            Loading station parcels…
          </div>
        ) : (
          <StaffParcelsTable parcels={currentTab.parcels} />
        )}
      </section>
    </main>
  );
}
