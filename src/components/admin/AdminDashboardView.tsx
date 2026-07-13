"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  Bus,
  ChevronLeft,
  ChevronRight,
  Info,
  Package,
  PackageCheck,
  Truck,
  UserCog,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PlatformOperatorMark } from "@/components/platform/PlatformOperatorMark";
import { AdminDemoWalkthrough } from "@/components/admin/AdminDemoWalkthrough";
import { useAdminSession } from "@/components/admin/AdminOperatorShell";
import { fetchAdminOverview, fetchAdminParcels } from "@/lib/admin-api";
import { getAdminOperator, getAdminOperatorName, isLegacyOperator } from "@/lib/admin-operator";
import { brandColorHeroGradient } from "@/lib/brand-color-theme";
import { OPERATOR_WELCOME_BG } from "@/lib/operators";
import { StaffLiveClock } from "@/components/staff/StaffLiveClock";
import type {
  AdminBranchSnapshot,
  AdminNetworkOverview,
  AdminParcelRow,
} from "@/types/admin";
import { cn } from "@/lib/utils";

type MetricCard = {
  key: string;
  label: string;
  value: number;
  icon: LucideIcon;
  href?: string;
  highlight?: boolean;
};

type OverviewTab = "performance" | "summary" | "branches" | "people" | "parcels" | "pipeline";

const OVERVIEW_TABS: { id: OverviewTab; label: string }[] = [
  { id: "performance", label: "Branch performance" },
  { id: "summary", label: "Network totals" },
  { id: "branches", label: "Branches" },
  { id: "people", label: "Users" },
  { id: "parcels", label: "Parcel register" },
  { id: "pipeline", label: "Pipeline" },
];

const PAGE_SIZE = 5;
const PARCEL_PAGE_SIZE = 8;

const PARCEL_STATUS_LABEL: Record<string, string> = {
  pending_dropoff: "Pending drop-off",
  in_transit: "In transit",
  arrived: "Arrived",
  ready_for_collection: "Awaiting pickup",
  collected: "Collected",
};

function formatParcelWhen(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-GH", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function parcelStatusClass(status: string) {
  if (status === "collected") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "in_transit") return "bg-sky-50 text-sky-700 ring-sky-200";
  if (status === "ready_for_collection" || status === "arrived") {
    return "bg-amber-50 text-amber-800 ring-amber-200";
  }
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

const PIE_COLORS = [
  "#0ea5e9",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
  "#f97316",
  "#64748b",
];

type PieDatum = { label: string; value: number };

function getPieBreakdown(
  tab: OverviewTab,
  overview: AdminNetworkOverview,
): { title: string; data: PieDatum[] } {
  const byBranch = (pick: (b: AdminBranchSnapshot) => number) =>
    overview.branches.map((b) => ({ label: b.name.replace(" Terminal", ""), value: pick(b) }));

  switch (tab) {
    case "performance":
    case "parcels":
      return { title: "Total parcels by branch", data: byBranch((b) => b.totalParcels) };
    case "summary":
      return {
        title: "Network parcel status",
        data: [
          { label: "Collected", value: overview.totalCollected },
          { label: "In transit", value: overview.inTransit },
          { label: "Awaiting collection", value: overview.readyForCollection },
        ],
      };
    case "branches":
    case "people":
      return { title: "Staff by branch", data: byBranch((b) => b.totalStaff) };
    case "pipeline":
      return { title: "In transit by branch", data: byBranch((b) => b.inTransit) };
  }
}

function OverviewPieChart({ title, data }: { title: string; data: PieDatum[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const cx = 60;
  const cy = 60;
  const r = 52;

  let angle = -Math.PI / 2;
  const slices = data.map((d, i) => {
    const fraction = total > 0 ? d.value / total : 0;
    const sweep = fraction * Math.PI * 2;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    const largeArc = sweep > Math.PI ? 1 : 0;
    return {
      ...d,
      fraction,
      color: PIE_COLORS[i % PIE_COLORS.length],
      path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`,
      fullCircle: fraction >= 0.999,
    };
  });

  return (
    <div>
      <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
        {title}
      </h3>
      <div className="mt-3 flex items-center justify-center">
        <svg viewBox="0 0 120 120" className="size-56 sm:size-64" role="img" aria-label={title}>
          {slices.map((slice) =>
            slice.fullCircle ? (
              <circle key={slice.label} cx={cx} cy={cy} r={r} fill={slice.color} />
            ) : slice.fraction > 0 ? (
              <path
                key={slice.label}
                d={slice.path}
                fill={slice.color}
                stroke="#fff"
                strokeWidth="1.5"
              />
            ) : null,
          )}
          <circle cx={cx} cy={cy} r={26} fill="#fff" />
          <text
            x={cx}
            y={cy - 2}
            textAnchor="middle"
            className="font-display"
            fontSize="13"
            fontWeight="700"
            fill="#0f172a"
          >
            {formatNetworkTotal(total)}
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize="7" fill="#64748b">
            TOTAL
          </text>
        </svg>
      </div>
      <ul className="mt-4 space-y-2">
        {slices.map((slice) => (
          <li key={slice.label} className="flex items-center gap-2 text-xs sm:text-sm">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: slice.color }}
              aria-hidden
            />
            <span className="font-body min-w-0 flex-1 truncate text-muted">{slice.label}</span>
            <span className="font-display font-bold text-foreground">
              {Math.round(slice.fraction * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function statusLabel(status: AdminBranchSnapshot["status"]) {
  if (status === "healthy") return "Healthy";
  if (status === "attention") return "Needs attention";
  return "Offline";
}

function statusClass(status: AdminBranchSnapshot["status"]) {
  if (status === "healthy") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "attention") return "bg-amber-50 text-amber-800 ring-amber-200";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function formatNetworkTotal(value: number): string {
  return value.toLocaleString("en-GH");
}

function buildMetricCards(overview: AdminNetworkOverview): MetricCard[] {
  return [
    {
      key: "staff",
      label: "Total staff",
      value: overview.activeStaff,
      icon: Users,
      href: "/admin/people",
    },
    {
      key: "branches",
      label: "Branches",
      value: overview.branchCount,
      icon: Building2,
      href: "/admin/branches",
      highlight: true,
    },
    {
      key: "leaders",
      label: "Branch leaders",
      value: overview.activeLeads,
      icon: UserCog,
      href: "/admin/leads",
    },
    {
      key: "parcels",
      label: "Total parcels",
      value: overview.totalParcels,
      icon: Package,
    },
    {
      key: "in-transit",
      label: "In transit now",
      value: overview.inTransit,
      icon: Truck,
    },
    {
      key: "collection",
      label: "Awaiting collection",
      value: overview.readyForCollection,
      icon: PackageCheck,
    },
    {
      key: "collected",
      label: "Total collected",
      value: overview.totalCollected,
      icon: Bus,
    },
  ];
}

const EMPTY_OVERVIEW: AdminNetworkOverview = {
  operatorLabel: "Operator",
  branchCount: 0,
  activeLeads: 0,
  activeStaff: 0,
  totalParcels: 0,
  inTransit: 0,
  readyForCollection: 0,
  totalCollected: 0,
  alerts: [],
  branches: [],
};

export function AdminDashboardView() {
  const { admin } = useAdminSession();
  const operator = getAdminOperator(admin);
  const operatorDisplayName = getAdminOperatorName(admin);
  const customBranding = Boolean(admin.brandColor || admin.logoDataUrl || admin.operatorName);
  const [overview, setOverview] = useState<AdminNetworkOverview>(EMPTY_OVERVIEW);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const metricCards = buildMetricCards(overview);
  const [activeTab, setActiveTab] = useState<OverviewTab>("performance");
  const [page, setPage] = useState(1);

  const [parcels, setParcels] = useState<AdminParcelRow[]>([]);
  const [parcelsTotal, setParcelsTotal] = useState(0);
  const [parcelsPage, setParcelsPage] = useState(1);
  const [parcelsLoading, setParcelsLoading] = useState(false);
  const [parcelQuery, setParcelQuery] = useState("");
  const [parcelStatus, setParcelStatus] = useState("all");
  const [parcelSearch, setParcelSearch] = useState("");

  useEffect(() => {
    if (!operator) {
      setOverview(EMPTY_OVERVIEW);
      setLoading(false);
      setLoadError(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await fetchAdminOverview();
        if (!cancelled) setOverview(data);
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Failed to load overview");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [operator]);

  useEffect(() => {
    if (activeTab !== "parcels" || !operator) return;
    let cancelled = false;
    void (async () => {
      setParcelsLoading(true);
      try {
        const result = await fetchAdminParcels({
          q: parcelSearch || undefined,
          status: parcelStatus,
          page: parcelsPage,
          limit: PARCEL_PAGE_SIZE,
        });
        if (cancelled) return;
        setParcels(result.items);
        setParcelsTotal(result.total);
      } catch {
        if (!cancelled) {
          setParcels([]);
          setParcelsTotal(0);
        }
      } finally {
        if (!cancelled) setParcelsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, parcelSearch, parcelStatus, parcelsPage, operator]);

  const isParcelsTab = activeTab === "parcels";
  const branchPage = Math.min(page, Math.max(1, Math.ceil(overview.branches.length / PAGE_SIZE) || 1));
  const summaryPage = Math.min(page, Math.max(1, Math.ceil(metricCards.length / PAGE_SIZE) || 1));
  const rowCount = isParcelsTab
    ? parcelsTotal
    : activeTab === "summary"
      ? metricCards.length
      : overview.branches.length;
  const pageSize = isParcelsTab ? PARCEL_PAGE_SIZE : PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(rowCount / pageSize) || 1);
  const currentPage = isParcelsTab ? Math.min(parcelsPage, totalPages) : Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageEnd = Math.min(
    pageStart + (isParcelsTab ? parcels.length : pageSize),
    rowCount,
  );
  const pagedBranches = overview.branches.slice(
    (branchPage - 1) * PAGE_SIZE,
    branchPage * PAGE_SIZE,
  );
  const pagedMetrics = metricCards.slice(
    (summaryPage - 1) * PAGE_SIZE,
    summaryPage * PAGE_SIZE,
  );

  const selectTab = (tab: OverviewTab) => {
    setActiveTab(tab);
    setPage(1);
    if (tab === "parcels") setParcelsPage(1);
  };

  const applyParcelSearch = () => {
    setParcelSearch(parcelQuery.trim());
    setParcelsPage(1);
  };

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div>
        {loadError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {loadError}
          </div>
        )}
        {loading && (
          <p className="font-body mb-4 text-sm text-muted">Loading live network data…</p>
        )}
        <section
          className={cn(
            "relative min-h-[148px] overflow-hidden rounded-2xl px-5 py-4 text-white shadow-md sm:min-h-[156px] sm:px-6 sm:py-5",
            !admin.operatorConfigured && "bg-[#0f172a]",
          )}
        >
          {admin.operatorConfigured &&
            admin.operator &&
            !customBranding &&
            isLegacyOperator(admin.operator) && (
            <div className="absolute inset-y-0 right-0 flex w-[72%] items-start justify-end sm:w-[68%] lg:w-[62%]">
              <Image
                src={OPERATOR_WELCOME_BG[admin.operator]}
                alt=""
                width={1200}
                height={800}
                priority
                className="h-full w-auto max-w-none object-contain object-right-top"
              />
            </div>
          )}
          {customBranding && admin.brandColor && (
            <div
              className="absolute inset-0 opacity-95"
              style={{ background: brandColorHeroGradient(admin.brandColor) }}
              aria-hidden
            />
          )}
          <div
            className="absolute inset-0"
            style={{
              background: admin.operatorConfigured
                ? customBranding
                  ? "linear-gradient(90deg, rgb(0 0 0 / 0.78) 0%, rgb(0 0 0 / 0.45) 38%, rgb(0 0 0 / 0.12) 62%, transparent 100%), linear-gradient(180deg, transparent 60%, rgb(0 0 0 / 0.22) 100%)"
                  : "linear-gradient(90deg, rgb(0 0 0 / 0.82) 0%, rgb(0 0 0 / 0.5) 32%, rgb(0 0 0 / 0.08) 58%, transparent 100%), linear-gradient(180deg, transparent 60%, rgb(0 0 0 / 0.2) 100%)"
                : "linear-gradient(155deg, #0f172a 0%, #1e293b 48%, #0f172a 100%)",
            }}
            aria-hidden
          />
          {admin.operatorConfigured && admin.operator && (
            <div className="pointer-events-none absolute right-4 top-4 z-10 sm:right-6 sm:top-5">
              <PlatformOperatorMark
                code={admin.operator}
                name={operatorDisplayName}
                brandColor={admin.brandColor ?? "#fd7e14"}
                logoDataUrl={admin.logoDataUrl}
                size="hero"
              />
            </div>
          )}

          <div className="relative z-10 flex min-h-[120px] flex-col justify-between pr-[10.5rem] sm:pr-[11.5rem]">
            <div className="flex items-start justify-between gap-4">
              <StaffLiveClock
                compact
                className="[&_.font-display]:text-lg [&_.font-display]:text-white sm:[&_.font-display]:text-xl"
              />
              {!admin.operatorConfigured ? (
                <Link
                  href="/admin/setup"
                  className="max-w-[11rem] shrink-0 text-right text-[10px] leading-snug text-amber-200/90 transition-colors hover:text-white sm:max-w-[13rem] sm:text-[11px]"
                >
                  Setup pending ·{" "}
                  <span className="font-semibold text-white/95">Complete transport setup</span>
                </Link>
              ) : (
                <p className="max-w-[10rem] text-right text-[10px] font-semibold uppercase leading-snug tracking-[0.12em] text-white/80 sm:max-w-[12rem] sm:text-[11px]">
                  {operatorDisplayName}
                </p>
              )}
            </div>

            <div className="mt-3">
              <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
                Welcome, {admin.displayName.split(" ")[0]}
              </h1>
              {admin.operatorConfigured && (
                <p className="font-body mt-1 text-xs text-white/80 sm:hidden">
                  {operatorDisplayName} · Network overview
                </p>
              )}
            </div>
          </div>
        </section>

        {admin.operatorConfigured ? <AdminDemoWalkthrough /> : null}

        <section className="mt-6 rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="mb-3">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
              Network snapshot
            </h2>
            <p className="font-body mt-1 text-sm text-muted">
              {admin.operatorConfigured
                ? "Key totals across your operator — tap a tab below for the full breakdown."
                : "Metrics appear after transport setup."}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {metricCards.map(({ key, label, value, icon: Icon, href, highlight }) => {
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
                    <p className="font-display text-xl font-bold leading-none text-foreground">
                      {formatNetworkTotal(value)}
                    </p>
                    <p className="font-body mt-1 text-[11px] leading-tight text-muted">{label}</p>
                  </div>
                </div>
              );

              if (href) {
                return (
                  <Link
                    key={key}
                    href={href}
                    className="group rounded-xl border border-border bg-surface px-3 py-2.5 shadow-sm transition-shadow hover:shadow-md"
                  >
                    {inner}
                  </Link>
                );
              }

              return (
                <div
                  key={key}
                  className="rounded-xl border border-border bg-surface px-3 py-2.5 shadow-sm"
                  style={highlight ? { borderColor: "var(--staff-accent)" } : undefined}
                >
                  {inner}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="mt-3 rounded-2xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border px-4 py-4 sm:px-5">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
            Totals by view
          </h2>
          <p className="font-body mt-1 text-sm text-muted">
            Same numbers as the cards above — broken down by branch where it helps.
          </p>
          <div className="mt-4 inline-flex max-w-full flex-wrap gap-1 rounded-2xl border border-border bg-background p-1.5">
            {OVERVIEW_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => selectTab(tab.id)}
                className={cn(
                  "font-display rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wide transition-all sm:px-4 sm:py-2.5",
                  activeTab === tab.id
                    ? "text-white shadow-md"
                    : "text-[var(--staff-accent-dark)] hover:bg-[var(--staff-accent-muted)] hover:text-[var(--staff-accent)]",
                )}
                style={
                  activeTab === tab.id
                    ? {
                        background: "var(--staff-accent)",
                        boxShadow: "0 8px 20px -12px rgba(15,23,42,0.45)",
                      }
                    : undefined
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {!overview.branches.length ? (
          <div className="px-4 py-12 text-center sm:px-5">
            <p className="font-body text-sm text-muted">
              No branch data yet. Complete transport setup to see totals by terminal.
            </p>
            <Link
              href="/admin/setup"
              className="font-display mt-4 inline-flex rounded-xl border border-border px-4 py-2 text-xs font-bold uppercase tracking-wide text-foreground hover:border-[var(--staff-accent)]"
            >
              Configure transport
            </Link>
          </div>
        ) : (
          <>
          <div className="grid lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="max-h-[420px] overflow-auto">
            {activeTab === "performance" && (
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-[#0b1220] text-[11px] uppercase tracking-wider text-white">
                  <tr>
                    <th className="w-10 px-3 py-2.5 font-semibold sm:px-4">#</th>
                    <th className="px-3 py-2.5 font-semibold">Branch</th>
                    <th className="px-3 py-2.5 font-semibold">Lead</th>
                    <th className="px-3 py-2.5 font-semibold">Total parcels</th>
                    <th className="px-3 py-2.5 font-semibold">Collected</th>
                    <th className="px-3 py-2.5 font-semibold">In transit</th>
                    <th className="px-3 py-2.5 font-semibold">Staff</th>
                    <th className="px-3 py-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedBranches.map((branch, index) => (
                    <tr key={branch.id} className="border-t border-border">
                      <td className="px-3 py-2.5 font-medium text-muted sm:px-4">
                        {pageStart + index + 1}
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="font-display font-semibold text-foreground">{branch.name}</p>
                        <p className="font-body text-xs text-muted">
                          {branch.city} · {branch.code}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 text-muted">
                        {branch.leadName ?? (
                          <span className="font-medium text-amber-700">Unassigned</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-foreground">
                        {formatNetworkTotal(branch.totalParcels)}
                      </td>
                      <td className="px-3 py-2.5 text-foreground">
                        {formatNetworkTotal(branch.totalCollected)}
                      </td>
                      <td className="px-3 py-2.5 text-foreground">{branch.inTransit}</td>
                      <td className="px-3 py-2.5 text-foreground">{branch.totalStaff}</td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
                            statusClass(branch.status),
                          )}
                        >
                          {statusLabel(branch.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-border bg-[#f8fafc] font-semibold">
                    <td className="px-3 py-2.5 text-foreground sm:px-4" colSpan={3}>
                      Network total
                    </td>
                    <td className="px-3 py-2.5 text-foreground">
                      {formatNetworkTotal(overview.totalParcels)}
                    </td>
                    <td className="px-3 py-2.5 text-foreground">
                      {formatNetworkTotal(overview.totalCollected)}
                    </td>
                    <td className="px-3 py-2.5 text-foreground">
                      {formatNetworkTotal(overview.inTransit)}
                    </td>
                    <td className="px-3 py-2.5 text-foreground">
                      {formatNetworkTotal(overview.activeStaff)}
                    </td>
                    <td className="px-3 py-2.5 text-muted">All time</td>
                  </tr>
                </tbody>
              </table>
            )}

            {activeTab === "summary" && (
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-[#0b1220] text-[11px] uppercase tracking-wider text-white">
                  <tr>
                    <th className="w-10 px-3 py-2.5 font-semibold sm:px-4">#</th>
                    <th className="px-3 py-2.5 font-semibold">Metric</th>
                    <th className="px-3 py-2.5 font-semibold sm:px-4">Network total</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedMetrics.map(({ key, label, value }, index) => (
                    <tr key={key} className="border-t border-border">
                      <td className="px-3 py-2.5 font-medium text-muted sm:px-4">
                        {pageStart + index + 1}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-foreground">{label}</td>
                      <td className="px-3 py-2.5 font-display text-base font-bold text-foreground sm:px-4">
                        {formatNetworkTotal(value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "branches" && (
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-[#0b1220] text-[11px] uppercase tracking-wider text-white">
                  <tr>
                    <th className="w-10 px-3 py-2.5 font-semibold sm:px-4">#</th>
                    <th className="px-3 py-2.5 font-semibold">Branch</th>
                    <th className="px-3 py-2.5 font-semibold">City</th>
                    <th className="px-3 py-2.5 font-semibold">Lead</th>
                    <th className="px-3 py-2.5 font-semibold">Staff</th>
                    <th className="px-3 py-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedBranches.map((branch, index) => (
                    <tr key={branch.id} className="border-t border-border">
                      <td className="px-3 py-2.5 font-medium text-muted sm:px-4">
                        {pageStart + index + 1}
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="font-display font-semibold text-foreground">{branch.name}</p>
                        <p className="font-mono text-xs text-muted">{branch.code}</p>
                      </td>
                      <td className="px-3 py-2.5 text-muted">{branch.city}</td>
                      <td className="px-3 py-2.5 text-muted">
                        {branch.leadName ?? (
                          <span className="font-medium text-amber-700">Unassigned</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-foreground">
                        {formatNetworkTotal(branch.totalStaff)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
                            statusClass(branch.status),
                          )}
                        >
                          {statusLabel(branch.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-border bg-[#f8fafc] font-semibold">
                    <td className="px-3 py-2.5 text-foreground sm:px-4" colSpan={4}>
                      Network total
                    </td>
                    <td className="px-3 py-2.5 text-foreground">
                      {formatNetworkTotal(overview.branchCount)} branches ·{" "}
                      {formatNetworkTotal(overview.activeStaff)} staff
                    </td>
                    <td className="px-3 py-2.5 text-muted">{overview.activeLeads} leads</td>
                  </tr>
                </tbody>
              </table>
            )}

            {activeTab === "people" && (
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-[#0b1220] text-[11px] uppercase tracking-wider text-white">
                  <tr>
                    <th className="w-10 px-3 py-2.5 font-semibold sm:px-4">#</th>
                    <th className="px-3 py-2.5 font-semibold">Branch</th>
                    <th className="px-3 py-2.5 font-semibold">Branch lead</th>
                    <th className="px-3 py-2.5 font-semibold">Total staff</th>
                    <th className="px-3 py-2.5 font-semibold">Staff online</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedBranches.map((branch, index) => (
                    <tr key={branch.id} className="border-t border-border">
                      <td className="px-3 py-2.5 font-medium text-muted sm:px-4">
                        {pageStart + index + 1}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-foreground">{branch.name}</td>
                      <td className="px-3 py-2.5 text-muted">
                        {branch.leadName ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-foreground">
                        {formatNetworkTotal(branch.totalStaff)}
                      </td>
                      <td className="px-3 py-2.5 text-foreground">{branch.staffOnline}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-border bg-[#f8fafc] font-semibold">
                    <td className="px-3 py-2.5 text-foreground sm:px-4" colSpan={3}>
                      Network total
                    </td>
                    <td className="px-3 py-2.5 text-foreground">
                      {formatNetworkTotal(overview.activeStaff)}
                    </td>
                    <td className="px-3 py-2.5 text-muted">
                      {overview.branches.reduce((sum, b) => sum + b.staffOnline, 0)} online now
                    </td>
                  </tr>
                </tbody>
              </table>
            )}

            {activeTab === "parcels" && (
              <>
                <div className="flex flex-wrap items-end gap-2 border-b border-border bg-[#f8fafc] px-3 py-3 sm:px-4">
                  <label className="min-w-[180px] flex-1">
                    <span className="font-display mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted">
                      Search
                    </span>
                    <input
                      value={parcelQuery}
                      onChange={(e) => setParcelQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") applyParcelSearch();
                      }}
                      placeholder="Parcel code, sender, receiver, phone…"
                      className="font-body w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-[var(--staff-accent)]"
                    />
                  </label>
                  <label>
                    <span className="font-display mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted">
                      Status
                    </span>
                    <select
                      value={parcelStatus}
                      onChange={(e) => {
                        setParcelStatus(e.target.value);
                        setParcelsPage(1);
                      }}
                      className="font-body rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-[var(--staff-accent)]"
                    >
                      <option value="all">All statuses</option>
                      <option value="pending_dropoff">Pending drop-off</option>
                      <option value="in_transit">In transit</option>
                      <option value="arrived">Arrived</option>
                      <option value="ready_for_collection">Awaiting pickup</option>
                      <option value="collected">Collected</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={applyParcelSearch}
                    className="font-display rounded-xl px-3.5 py-2 text-[10px] font-bold uppercase tracking-wide text-white"
                    style={{ background: "var(--staff-accent)" }}
                  >
                    Search
                  </button>
                  <Link
                    href="/admin/reports/parcel-register"
                    className="font-display rounded-xl border border-border px-3.5 py-2 text-[10px] font-bold uppercase tracking-wide text-foreground hover:border-[var(--staff-accent)]"
                  >
                    Full report
                  </Link>
                </div>
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-[#0b1220] text-[11px] uppercase tracking-wider text-white">
                    <tr>
                      <th className="w-10 px-3 py-2.5 font-semibold sm:px-4">#</th>
                      <th className="px-3 py-2.5 font-semibold">Parcel code</th>
                      <th className="px-3 py-2.5 font-semibold">Booked</th>
                      <th className="px-3 py-2.5 font-semibold">Sender</th>
                      <th className="px-3 py-2.5 font-semibold">Receiver</th>
                      <th className="px-3 py-2.5 font-semibold">Origin</th>
                      <th className="px-3 py-2.5 font-semibold">Destination</th>
                      <th className="px-3 py-2.5 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parcelsLoading ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-muted">
                          Loading parcels…
                        </td>
                      </tr>
                    ) : parcels.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-muted">
                          No parcels found for this operator yet.
                        </td>
                      </tr>
                    ) : (
                      parcels.map((parcel, index) => (
                        <tr key={parcel.bookingReference} className="border-t border-border align-top">
                          <td className="px-3 py-2.5 font-medium text-muted sm:px-4">
                            {pageStart + index + 1}
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="font-mono text-xs font-bold text-foreground">
                              {parcel.bookingReference}
                            </p>
                            <p className="font-body mt-0.5 text-[10px] text-muted">
                              {parcel.itemCount} item{parcel.itemCount === 1 ? "" : "s"}
                              {parcel.busNumber ? ` · Bus ${parcel.busNumber}` : ""}
                            </p>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-muted">
                            {formatParcelWhen(parcel.createdAt)}
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="font-medium text-foreground">{parcel.senderName}</p>
                            <p className="font-body text-[11px] text-muted">{parcel.senderPhone}</p>
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="font-medium text-foreground">{parcel.recipientName}</p>
                            <p className="font-body text-[11px] text-muted">{parcel.recipientPhone}</p>
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="font-medium text-foreground">{parcel.originStationName}</p>
                            <p className="font-body text-[11px] text-muted">
                              {parcel.originCity ?? parcel.originStationCode}
                            </p>
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="font-medium text-foreground">
                              {parcel.destinationStationName}
                            </p>
                            <p className="font-body text-[11px] text-muted">
                              {parcel.destinationCity ?? "—"}
                            </p>
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
                                parcelStatusClass(parcel.status),
                              )}
                            >
                              {PARCEL_STATUS_LABEL[parcel.status] ?? parcel.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </>
            )}

            {activeTab === "pipeline" && (
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-[#0b1220] text-[11px] uppercase tracking-wider text-white">
                  <tr>
                    <th className="w-10 px-3 py-2.5 font-semibold sm:px-4">#</th>
                    <th className="px-3 py-2.5 font-semibold">Branch</th>
                    <th className="px-3 py-2.5 font-semibold">In transit now</th>
                    <th className="px-3 py-2.5 font-semibold">Awaiting collection</th>
                    <th className="px-3 py-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedBranches.map((branch, index) => (
                    <tr key={branch.id} className="border-t border-border">
                      <td className="px-3 py-2.5 font-medium text-muted sm:px-4">
                        {pageStart + index + 1}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-foreground">{branch.name}</td>
                      <td className="px-3 py-2.5 font-semibold text-foreground">{branch.inTransit}</td>
                      <td className="px-3 py-2.5 text-foreground">{branch.readyForCollection}</td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
                            statusClass(branch.status),
                          )}
                        >
                          {statusLabel(branch.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-border bg-[#f8fafc] font-semibold">
                    <td className="px-3 py-2.5 text-foreground sm:px-4" colSpan={2}>
                      Network total
                    </td>
                    <td className="px-3 py-2.5 text-foreground">
                      {formatNetworkTotal(overview.inTransit)}
                    </td>
                    <td className="px-3 py-2.5 text-foreground">
                      {formatNetworkTotal(overview.readyForCollection)}
                    </td>
                    <td className="px-3 py-2.5 text-muted">Live pipeline</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          <aside className="border-t border-border px-4 py-4 lg:border-l lg:border-t-0">
            <OverviewPieChart {...getPieBreakdown(activeTab, overview)} />
          </aside>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5">
            <p className="font-body text-xs text-muted">
              {rowCount === 0 ? (
                "No rows to show"
              ) : (
                <>
                  Showing <span className="font-semibold text-foreground">{pageStart + 1}</span>–
                  <span className="font-semibold text-foreground">{pageEnd}</span> of{" "}
                  <span className="font-semibold text-foreground">{rowCount}</span>
                </>
              )}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  isParcelsTab
                    ? setParcelsPage(Math.max(1, currentPage - 1))
                    : setPage(Math.max(1, currentPage - 1))
                }
                disabled={currentPage === 1}
                aria-label="Previous page"
                className="flex size-8 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:border-[var(--staff-accent)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() =>
                    isParcelsTab ? setParcelsPage(pageNumber) : setPage(pageNumber)
                  }
                  aria-label={`Page ${pageNumber}`}
                  aria-current={pageNumber === currentPage ? "page" : undefined}
                  className={cn(
                    "font-display size-8 rounded-lg text-xs font-bold transition-colors",
                    pageNumber === currentPage
                      ? "text-white"
                      : "border border-border text-foreground hover:border-[var(--staff-accent)]",
                  )}
                  style={
                    pageNumber === currentPage
                      ? { background: "var(--staff-accent)" }
                      : undefined
                  }
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                onClick={() =>
                  isParcelsTab
                    ? setParcelsPage(Math.min(totalPages, currentPage + 1))
                    : setPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                aria-label="Next page"
                className="flex size-8 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:border-[var(--staff-accent)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
          </>
        )}
      </section>

      <section className="mt-3 rounded-2xl border border-border bg-surface shadow-sm">
          <div className="border-b border-border px-4 py-3 sm:px-5 sm:py-4">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
              Alerts
            </h2>
            <p className="font-body mt-1 text-xs text-muted sm:text-sm">
              Items that may need HQ attention.
            </p>
          </div>
          <ul className="max-h-[380px] divide-y divide-border overflow-y-auto">
            {overview.alerts.map((alert) => (
              <li key={alert.id} className="flex gap-3 px-4 py-3 sm:px-5">
                <span
                  className={cn(
                    "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg",
                    alert.severity === "warning"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-sky-100 text-sky-700",
                  )}
                >
                  {alert.severity === "warning" ? (
                    <AlertTriangle className="size-4" />
                  ) : (
                    <Info className="size-4" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="font-body text-xs leading-relaxed text-foreground sm:text-sm">
                    {alert.message}
                  </p>
                  {alert.branchName && (
                    <p className="font-body mt-1 text-[10px] font-medium text-muted sm:text-xs">
                      {alert.branchName}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
    </main>
  );
}
