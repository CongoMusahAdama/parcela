"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  Package,
  PackageCheck,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { useAdminSession } from "@/components/admin/AdminOperatorShell";
import { fetchAdminOverview } from "@/lib/admin-api";
import { getAdminOperator } from "@/lib/admin-operator";
import { OPERATOR_REPORT_BRAND } from "@/lib/operators";
import type { AdminBranchSnapshot, AdminBranchStatus, AdminNetworkOverview } from "@/types/admin";
import type { Operator } from "@/types/parcel";
import { cn } from "@/lib/utils";

type AnalyticsBranch = AdminBranchSnapshot & {
  address?: string;
};

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

function statusLabel(status: AdminBranchStatus) {
  if (status === "healthy") return "Healthy";
  if (status === "attention") return "Needs attention";
  return "Offline";
}

function statusClass(status: AdminBranchStatus) {
  if (status === "healthy") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "attention") return "bg-amber-50 text-amber-800 ring-amber-200";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function AnalyticsPieChart({
  title,
  data,
}: {
  title: string;
  data: { label: string; value: number }[];
}) {
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
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
        {title}
      </h3>
      {total === 0 ? (
        <p className="font-body mt-8 text-center text-sm text-muted">No data yet</p>
      ) : (
        <>
          <div className="mt-3 flex items-center justify-center">
            <svg viewBox="0 0 120 120" className="size-44 sm:size-52" role="img" aria-label={title}>
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
                fontSize="12"
                fontWeight="700"
                fill="#0f172a"
              >
                {total.toLocaleString("en-GH")}
              </text>
              <text x={cx} y={cy + 12} textAnchor="middle" fontSize="7" fill="#64748b">
                TOTAL
              </text>
            </svg>
          </div>
          <ul className="mt-3 max-h-[180px] space-y-1.5 overflow-y-auto">
            {slices.map((slice) => (
              <li key={slice.label} className="flex items-center gap-2 text-xs">
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
        </>
      )}
    </div>
  );
}

export function AdminAnalyticsView() {
  const { admin } = useAdminSession();
  const operator = getAdminOperator(admin);
  const companyName = operator
    ? OPERATOR_REPORT_BRAND[operator].companyName
    : "Your transport";

  const [overview, setOverview] = useState<AdminNetworkOverview>(EMPTY_OVERVIEW);
  const [branches, setBranches] = useState<AnalyticsBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"parcels" | "collected" | "transit" | "staff">("parcels");

  useEffect(() => {
    if (!operator) {
      setOverview(EMPTY_OVERVIEW);
      setBranches([]);
      setLoading(false);
      return;
    }
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await fetchAdminOverview();
        if (cancelled) return;
        setOverview(data);
        setBranches(data.branches);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [operator]);

  const sorted = useMemo(() => {
    const copy = [...branches];
    copy.sort((a, b) => {
      if (sortBy === "collected") return b.totalCollected - a.totalCollected;
      if (sortBy === "transit") return b.inTransit - a.inTransit;
      if (sortBy === "staff") return b.totalStaff - a.totalStaff;
      return b.totalParcels - a.totalParcels;
    });
    return copy;
  }, [branches, sortBy]);

  const totals = useMemo(() => {
    return {
      parcels: branches.reduce((s, b) => s + b.totalParcels, 0),
      collected: branches.reduce((s, b) => s + b.totalCollected, 0),
      inTransit: branches.reduce((s, b) => s + b.inTransit, 0),
      awaiting: branches.reduce((s, b) => s + b.readyForCollection, 0),
      staff: branches.reduce((s, b) => s + b.totalStaff, 0),
      attention: branches.filter((b) => b.status !== "healthy").length,
    };
  }, [branches]);

  const collectionRate =
    totals.parcels > 0 ? Math.round((totals.collected / totals.parcels) * 100) : 0;

  const topBranches = sorted.slice(0, 6);
  const maxParcels = Math.max(...topBranches.map((b) => b.totalParcels), 1);

  const parcelsByCity = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of branches) {
      map.set(b.city, (map.get(b.city) ?? 0) + b.totalParcels);
    }
    return [...map.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [branches]);

  const statusBreakdown = useMemo(
    () =>
      [
        { label: "Healthy", value: branches.filter((b) => b.status === "healthy").length },
        { label: "Needs attention", value: branches.filter((b) => b.status === "attention").length },
        { label: "Offline", value: branches.filter((b) => b.status === "offline").length },
      ].filter((d) => d.value > 0),
    [branches],
  );

  if (!operator) {
    return (
      <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <h1 className="font-display text-xl font-bold text-foreground">Insights</h1>
        <p className="font-body mt-2 text-sm text-muted">
          Complete Admin setup first so insights are limited to your transport.
        </p>
        <Link
          href="/admin/setup"
          className="font-display mt-4 inline-flex rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white"
          style={{ background: "var(--staff-accent)" }}
        >
          Go to Admin setup
        </Link>
      </main>
    );
  }

  const pipelineBreakdown = [
    { label: "Collected", value: totals.collected },
    { label: "In transit", value: totals.inTransit },
    { label: "Awaiting collection", value: totals.awaiting },
  ].filter((d) => d.value > 0);

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Insights
            </h1>
            <p className="font-body mt-1 text-sm text-muted">
              Compare {operator} branches, volume trends, and live pipeline for {companyName}.
            </p>
          </div>
          <Link
            href="/admin/reports"
            className="font-display inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white"
            style={{ background: "var(--staff-accent)" }}
          >
            <TrendingUp className="size-4" />
            Open reports
          </Link>
        </div>

        {overview.alerts.length > 0 && (
          <section className="mt-5 rounded-2xl border border-border bg-surface shadow-sm">
            <div className="border-b border-border px-4 py-3 sm:px-5">
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
                Alerts
              </h2>
              <p className="font-body mt-1 text-xs text-muted">
                Items that may need HQ attention — shown up top so you see them first.
              </p>
            </div>
            <ul className="divide-y divide-border">
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
                    <AlertTriangle className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-body text-sm text-foreground">{alert.message}</p>
                    {alert.branchName ? (
                      <p className="font-body mt-1 text-[10px] font-medium text-muted">
                        {alert.branchName}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[
            { label: "Stations", value: branches.length, icon: Building2 },
            { label: "Total parcels", value: totals.parcels, icon: Package },
            { label: "Collected", value: totals.collected, icon: PackageCheck },
            { label: "In transit", value: totals.inTransit, icon: Truck },
            { label: "Staff", value: totals.staff, icon: Users },
            { label: "Collection rate", value: `${collectionRate}%`, icon: TrendingUp },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-xl border border-border bg-surface px-3 py-2.5 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: "var(--staff-accent-muted)",
                    color: "var(--staff-accent)",
                  }}
                >
                  <Icon className="size-4" strokeWidth={2.25} />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-lg font-bold leading-none text-foreground">
                    {typeof value === "number" ? value.toLocaleString("en-GH") : value}
                  </p>
                  <p className="font-body mt-1 text-[11px] leading-tight text-muted">{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="rounded-2xl border border-border bg-surface shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
              <div>
                <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
                  Branch comparison
                </h2>
                <p className="font-body mt-1 text-xs text-muted">
                  Volume by terminal — sort to compare performance.
                </p>
              </div>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "parcels" | "collected" | "transit" | "staff")
                }
                className="font-body rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-[var(--staff-accent)]"
              >
                <option value="parcels">Sort by parcels</option>
                <option value="collected">Sort by collected</option>
                <option value="transit">Sort by in transit</option>
                <option value="staff">Sort by staff</option>
              </select>
            </div>

            {loading ? (
              <p className="font-body px-4 py-12 text-center text-sm text-muted sm:px-5">
                Loading network analytics…
              </p>
            ) : (
              <>
                <div className="space-y-3 border-b border-border px-4 py-4 sm:px-5">
                  <p className="font-display text-[11px] font-bold uppercase tracking-wider text-muted">
                    Top terminals
                  </p>
                  {topBranches.map((branch) => (
                    <div key={branch.id}>
                      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                        <span className="font-body truncate text-foreground">
                          {branch.name.replace(" Terminal", "")}
                        </span>
                        <span className="font-display font-bold text-foreground">
                          {branch.totalParcels.toLocaleString("en-GH")}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(6, (branch.totalParcels / maxParcels) * 100)}%`,
                            background: "var(--staff-accent)",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="max-h-[420px] overflow-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-[#0b1220] text-[11px] uppercase tracking-wider text-white">
                      <tr>
                        <th className="w-10 px-3 py-2.5 font-semibold sm:px-4">#</th>
                        <th className="px-3 py-2.5 font-semibold">Branch</th>
                        <th className="px-3 py-2.5 font-semibold">Parcels</th>
                        <th className="px-3 py-2.5 font-semibold">Collected</th>
                        <th className="px-3 py-2.5 font-semibold">Rate</th>
                        <th className="px-3 py-2.5 font-semibold">In transit</th>
                        <th className="px-3 py-2.5 font-semibold">Staff</th>
                        <th className="px-3 py-2.5 font-semibold sm:px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((branch, index) => {
                        const rate =
                          branch.totalParcels > 0
                            ? Math.round((branch.totalCollected / branch.totalParcels) * 100)
                            : 0;
                        return (
                          <tr key={branch.id} className="border-t border-border">
                            <td className="px-3 py-2.5 font-medium text-muted sm:px-4">
                              {index + 1}
                            </td>
                            <td className="px-3 py-2.5">
                              <p className="font-display font-semibold text-foreground">
                                {branch.name}
                              </p>
                              <p className="font-body text-[10px] text-muted">
                                {branch.city} · {branch.code}
                              </p>
                            </td>
                            <td className="px-3 py-2.5 font-semibold text-foreground">
                              {branch.totalParcels.toLocaleString("en-GH")}
                            </td>
                            <td className="px-3 py-2.5 text-foreground">
                              {branch.totalCollected.toLocaleString("en-GH")}
                            </td>
                            <td className="px-3 py-2.5 text-muted">{rate}%</td>
                            <td className="px-3 py-2.5 text-foreground">{branch.inTransit}</td>
                            <td className="px-3 py-2.5 text-foreground">{branch.totalStaff}</td>
                            <td className="px-3 py-2.5 sm:px-4">
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>

          <div className="space-y-4">
            <AnalyticsPieChart title="Parcels by city" data={parcelsByCity} />
            <AnalyticsPieChart title="Station health" data={statusBreakdown} />
            <AnalyticsPieChart title="Pipeline mix" data={pipelineBreakdown} />
          </div>
        </div>
      </div>
    </main>
  );
}
