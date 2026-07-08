"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { useAdminSession } from "@/components/admin/AdminOperatorShell";
import {
  fetchAdminOverview,
  fetchAdminStations,
  upsertAdminLeadApi,
} from "@/lib/admin-api";
import { getAdminOperator } from "@/lib/admin-operator";
import { OPERATOR_ACCENT, OPERATOR_REPORT_BRAND } from "@/lib/operators";
import { showSuccessAlert, showValidationAlert } from "@/lib/sweetalert";
import type { AdminBranchStatus } from "@/types/admin";
import type { Operator } from "@/types/parcel";
import { cn } from "@/lib/utils";

type BranchRow = {
  id: string;
  name: string;
  code: string;
  city: string;
  address: string;
  leadName: string | null;
  leadPhone: string;
  leadEmail: string;
  totalStaff: number;
  totalParcels: number;
  inTransit: number;
  staffOnline: number;
  status: AdminBranchStatus;
};

type StationAction = "assign-lead" | "resolve-status" | null;

const PAGE_SIZE = 8;

const inputClass =
  "font-body w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-[var(--staff-accent)]";

const labelClass =
  "font-display mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted";

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


function BranchesPieChart({ rows }: { rows: BranchRow[] }) {
  const byCity = new Map<string, number>();
  for (const row of rows) {
    byCity.set(row.city, (byCity.get(row.city) ?? 0) + 1);
  }
  const data = [...byCity.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

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
        Stations by city
      </h3>
      {total === 0 ? (
        <p className="font-body mt-8 text-center text-sm text-muted">No stations yet</p>
      ) : (
        <>
          <div className="mt-3 flex items-center justify-center">
            <svg
              viewBox="0 0 120 120"
              className="size-48 sm:size-56"
              role="img"
              aria-label="Stations by city"
            >
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
                {total}
              </text>
              <text x={cx} y={cy + 12} textAnchor="middle" fontSize="7" fill="#64748b">
                TOTAL
              </text>
            </svg>
          </div>
          <ul className="mt-4 max-h-[240px] space-y-2 overflow-y-auto">
            {slices.map((slice) => (
              <li key={slice.label} className="flex items-center gap-2 text-xs sm:text-sm">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: slice.color }}
                  aria-hidden
                />
                <span className="font-body min-w-0 flex-1 truncate text-muted">{slice.label}</span>
                <span className="font-display font-bold text-foreground">
                  {slice.value} · {Math.round(slice.fraction * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function AdminBranchesView() {
  const { admin } = useAdminSession();
  const operator = getAdminOperator(admin);
  const companyName = operator
    ? OPERATOR_REPORT_BRAND[operator].companyName
    : "Your transport";

  const [rows, setRows] = useState<BranchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | AdminBranchStatus>("all");
  const [page, setPage] = useState(1);
  const [actionStation, setActionStation] = useState<BranchRow | null>(null);
  const [actionType, setActionType] = useState<StationAction>(null);
  const [leadDraft, setLeadDraft] = useState({ name: "", phone: "", email: "" });
  const [savingAction, setSavingAction] = useState(false);

  useEffect(() => {
    if (!operator) {
      setRows([]);
      setLoading(false);
      return;
    }
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [overview, stations] = await Promise.all([
          fetchAdminOverview(),
          fetchAdminStations(),
        ]);
        if (cancelled) return;
        const stationById = new Map(stations.map((s) => [s.id, s]));
        setRows(
          overview.branches.map((branch) => {
            const station = stationById.get(branch.id);
            return {
              id: branch.id,
              name: branch.name,
              code: branch.code,
              city: branch.city,
              address: station?.address ?? "",
              leadName: branch.leadName,
              leadPhone: station?.leadPhone ?? "",
              leadEmail: station?.leadEmail ?? "",
              totalStaff: branch.totalStaff,
              totalParcels: branch.totalParcels,
              inTransit: branch.inTransit,
              staffOnline: branch.staffOnline,
              status: branch.status,
            };
          }),
        );
      } catch (error) {
        if (!cancelled) {
          void showValidationAlert({
            title: "Unable to load branches",
            text: error instanceof Error ? error.message : "Try again in a moment.",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [operator]);

  const cities = useMemo(
    () => [...new Set(rows.map((r) => r.city))].sort((a, b) => a.localeCompare(b)),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (cityFilter !== "all" && row.city !== cityFilter) return false;
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        row.code.toLowerCase().includes(q) ||
        row.city.toLowerCase().includes(q) ||
        (row.leadName?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [rows, query, cityFilter, statusFilter]);

  if (!operator) {
    return (
      <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <h1 className="font-display text-xl font-bold text-foreground">Branches</h1>
        <p className="font-body mt-2 text-sm text-muted">
          Complete Admin setup first so HQ only shows your transport network.
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, filtered.length);
  const paged = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const unassignedLeads = rows.filter((r) => !r.leadName).length;
  const attentionCount = rows.filter((r) => r.status === "attention").length;
  const totalStaff = rows.reduce((sum, r) => sum + r.totalStaff, 0);

  const openAssignLead = (row: BranchRow) => {
    setActionStation(row);
    setActionType("assign-lead");
    setLeadDraft({
      name: row.leadName ?? "",
      phone: row.leadPhone,
      email: row.leadEmail,
    });
  };

  const openResolveStatus = (row: BranchRow) => {
    setActionStation(row);
    setActionType("resolve-status");
  };

  const closeAction = () => {
    setActionStation(null);
    setActionType(null);
    setLeadDraft({ name: "", phone: "", email: "" });
  };

  const saveAssignLead = async () => {
    if (!actionStation) return;
    const name = leadDraft.name.trim();
    const phone = leadDraft.phone.trim();
    if (!name || !phone) {
      void showValidationAlert({
        title: "Lead details missing",
        text: "Enter the lead name and phone number. Email is optional.",
      });
      return;
    }

    setSavingAction(true);
    try {
      const result = await upsertAdminLeadApi({
        stationId: actionStation.id,
        leadName: name,
        leadPhone: phone,
        leadEmail: leadDraft.email.trim() || undefined,
      });
      setRows((prev) =>
        prev.map((row) =>
          row.id === actionStation.id
            ? {
                ...row,
                leadName: result.lead.displayName,
                leadPhone: result.lead.phone,
                leadEmail: result.lead.email,
                status: row.status === "attention" && !row.leadName ? "healthy" : row.status,
              }
            : row,
        ),
      );
      await showSuccessAlert({
        title: "Lead assigned",
        text: `${result.lead.displayName} is now the lead for ${actionStation.name}. ${
          result.smsSent
            ? "Login PIN was sent by SMS."
            : "A PIN was generated — use Branch leads → Send login if needed."
        }`,
        confirmButtonColor: OPERATOR_ACCENT[operator],
      });
      closeAction();
    } catch (error) {
      await showValidationAlert({
        title: "Unable to assign lead",
        text: error instanceof Error ? error.message : "Try again.",
      });
    } finally {
      setSavingAction(false);
    }
  };

  const saveResolveStatus = async () => {
    if (!actionStation) return;
    setSavingAction(true);
    setRows((prev) =>
      prev.map((row) =>
        row.id === actionStation.id ? { ...row, status: "healthy" } : row,
      ),
    );
    await showSuccessAlert({
      title: "Station marked healthy",
      text: `${actionStation.name} no longer needs attention.`,
      confirmButtonColor: OPERATOR_ACCENT[operator],
    });
    setSavingAction(false);
    closeAction();
  };

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              All stations
            </h1>
            <p className="font-body mt-1 text-sm text-muted">
              Every {operator} terminal across Ghana for {companyName}.
            </p>
          </div>
          <Link
            href="/admin/leads"
            className="font-display inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white"
            style={{ background: "var(--staff-accent)" }}
          >
            <UserCog className="size-4" />
            Manage leads
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Stations", value: rows.length, icon: Building2 },
            { label: "Cities", value: cities.length, icon: MapPin },
            { label: "Total staff", value: totalStaff, icon: Users },
            { label: "Needs attention", value: attentionCount + unassignedLeads, icon: UserCog },
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
                  <p className="font-display text-xl font-bold leading-none text-foreground">
                    {value.toLocaleString("en-GH")}
                  </p>
                  <p className="font-body mt-1 text-[11px] leading-tight text-muted">{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-2xl border border-border bg-surface shadow-sm">
            <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 sm:px-5">
              <div className="relative min-w-[12rem] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search station, code, city, lead…"
                  className="font-body w-full rounded-xl border border-border bg-white py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-[var(--staff-accent)]"
                />
              </div>
              <select
                value={cityFilter}
                onChange={(e) => {
                  setCityFilter(e.target.value);
                  setPage(1);
                }}
                className="font-body rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-[var(--staff-accent)]"
              >
                <option value="all">All cities</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as "all" | AdminBranchStatus);
                  setPage(1);
                }}
                className="font-body rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-[var(--staff-accent)]"
              >
                <option value="all">All status</option>
                <option value="healthy">Healthy</option>
                <option value="attention">Needs attention</option>
                <option value="offline">Offline</option>
              </select>
            </div>

            {loading ? (
              <p className="font-body px-4 py-12 text-center text-sm text-muted sm:px-5">
                Loading {operator} stations across Ghana…
              </p>
            ) : filtered.length === 0 ? (
              <p className="font-body px-4 py-12 text-center text-sm text-muted sm:px-5">
                No stations match your filters.
              </p>
            ) : (
              <>
                <div className="max-h-[520px] overflow-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-[#0b1220] text-[11px] uppercase tracking-wider text-white">
                      <tr>
                        <th className="w-10 px-3 py-2.5 font-semibold sm:px-4">#</th>
                        <th className="px-3 py-2.5 font-semibold">Station</th>
                        <th className="px-3 py-2.5 font-semibold">City</th>
                        <th className="px-3 py-2.5 font-semibold">Lead</th>
                        <th className="px-3 py-2.5 font-semibold">Staff</th>
                        <th className="px-3 py-2.5 font-semibold">Parcels</th>
                        <th className="px-3 py-2.5 font-semibold">In transit</th>
                        <th className="px-3 py-2.5 font-semibold">Status</th>
                        <th className="px-3 py-2.5 font-semibold sm:px-4">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map((row, index) => (
                        <tr key={row.id} className="border-t border-border">
                          <td className="px-3 py-2.5 font-medium text-muted sm:px-4">
                            {pageStart + index + 1}
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="font-display font-semibold text-foreground">{row.name}</p>
                            <p className="font-mono text-[10px] text-muted">{row.code}</p>
                          </td>
                          <td className="px-3 py-2.5 text-muted">{row.city}</td>
                          <td className="px-3 py-2.5 text-muted">
                            {row.leadName ?? (
                              <span className="font-medium text-amber-700">Unassigned</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-foreground">
                            {row.totalStaff}
                            <span className="ml-1 text-[10px] text-muted">
                              ({row.staffOnline} online)
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-foreground">
                            {row.totalParcels.toLocaleString("en-GH")}
                          </td>
                          <td className="px-3 py-2.5 text-foreground">{row.inTransit}</td>
                          <td className="px-3 py-2.5">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
                                statusClass(row.status),
                              )}
                            >
                              {statusLabel(row.status)}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 sm:px-4">
                            <div className="flex flex-wrap gap-1.5">
                              {!row.leadName ? (
                                <button
                                  type="button"
                                  onClick={() => openAssignLead(row)}
                                  className="font-display rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white"
                                  style={{ background: "var(--staff-accent)" }}
                                >
                                  Assign lead
                                </button>
                              ) : row.status === "attention" || row.status === "offline" ? (
                                <button
                                  type="button"
                                  onClick={() => openResolveStatus(row)}
                                  className="font-display rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-800"
                                >
                                  Resolve
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => openAssignLead(row)}
                                  className="font-display rounded-lg border border-border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-foreground hover:border-[var(--staff-accent)]"
                                >
                                  Edit lead
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5">
                  <p className="font-body text-xs text-muted">
                    Showing{" "}
                    <span className="font-semibold text-foreground">
                      {filtered.length === 0 ? 0 : pageStart + 1}
                    </span>
                    –
                    <span className="font-semibold text-foreground">{pageEnd}</span> of{" "}
                    <span className="font-semibold text-foreground">{filtered.length}</span>
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPage(Math.max(1, currentPage - 1))}
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
                        onClick={() => setPage(pageNumber)}
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
                      onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
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

          <aside className="rounded-2xl border border-border bg-surface p-5 shadow-sm lg:sticky lg:top-4">
            <BranchesPieChart rows={filtered.length ? filtered : rows} />
          </aside>
        </div>
      </div>

      {actionStation && actionType && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
          <div
            className="absolute inset-0"
            onClick={closeAction}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="station-action-title"
            className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-surface p-5 shadow-xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="station-action-title"
                  className="font-display text-base font-bold text-foreground"
                >
                  {actionType === "assign-lead"
                    ? actionStation.leadName
                      ? "Edit branch lead"
                      : "Assign branch lead"
                    : "Resolve station status"}
                </h2>
                <p className="font-body mt-1 text-sm text-muted">
                  {actionStation.name}
                  <span className="font-mono ml-2 text-xs">
                    {actionStation.code} · {actionStation.city}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={closeAction}
                aria-label="Close"
                className="rounded-lg p-1.5 text-muted hover:bg-slate-100 hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {actionType === "assign-lead" ? (
              <div className="mt-5 space-y-3">
                <div>
                  <label htmlFor="action-lead-name" className={labelClass}>
                    Lead name
                  </label>
                  <input
                    id="action-lead-name"
                    type="text"
                    value={leadDraft.name}
                    onChange={(e) => setLeadDraft((d) => ({ ...d, name: e.target.value }))}
                    placeholder="Ama Mensah"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="action-lead-phone" className={labelClass}>
                    Phone number
                  </label>
                  <input
                    id="action-lead-phone"
                    type="tel"
                    value={leadDraft.phone}
                    onChange={(e) => setLeadDraft((d) => ({ ...d, phone: e.target.value }))}
                    placeholder="024 000 0000"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="action-lead-email" className={labelClass}>
                    Email{" "}
                    <span className="normal-case tracking-normal text-muted/70">(optional)</span>
                  </label>
                  <input
                    id="action-lead-email"
                    type="email"
                    value={leadDraft.email}
                    onChange={(e) => setLeadDraft((d) => ({ ...d, email: e.target.value }))}
                    placeholder="lead@company.com"
                    className={inputClass}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="font-body text-sm text-amber-900">
                  Mark this station as healthy after you have attended to the issue (staffing,
                  backlog, or connectivity).
                </p>
                <p className="font-body mt-2 text-xs text-amber-800/80">
                  Current status: {statusLabel(actionStation.status)}
                  {!actionStation.leadName ? " · Lead still unassigned" : ""}
                </p>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeAction}
                className="font-display rounded-xl border border-border px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-foreground"
              >
                Cancel
              </button>
              {actionType === "assign-lead" ? (
                <button
                  type="button"
                  onClick={saveAssignLead}
                  disabled={savingAction}
                  className="font-display inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white disabled:opacity-60"
                  style={{ background: "var(--staff-accent)" }}
                >
                  <UserCog className="size-4" />
                  {savingAction ? "Saving…" : "Save lead"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={saveResolveStatus}
                  disabled={savingAction}
                  className="font-display inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white disabled:opacity-60"
                  style={{ background: "var(--staff-accent)" }}
                >
                  <CheckCircle2 className="size-4" />
                  {savingAction ? "Saving…" : "Mark healthy"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
