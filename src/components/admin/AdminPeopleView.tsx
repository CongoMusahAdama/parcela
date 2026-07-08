"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  Phone,
  Search,
  Shield,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { useAdminSession } from "@/components/admin/AdminOperatorShell";
import { fetchAdminPeople, setAdminPersonActiveApi } from "@/lib/admin-api";
import { getAdminOperator } from "@/lib/admin-operator";
import { OPERATOR_ACCENT, OPERATOR_REPORT_BRAND } from "@/lib/operators";
import { showSuccessAlert, showValidationAlert } from "@/lib/sweetalert";
import type { Operator } from "@/types/parcel";
import { cn } from "@/lib/utils";

type PersonRole = "branch_lead" | "counter_staff";
type PersonStatus = "active" | "inactive";

type PersonRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: PersonRole;
  stationId: string;
  stationName: string;
  stationCode: string;
  city: string;
  status: PersonStatus;
};

const PAGE_SIZE = 8;

const PIE_COLORS = ["#8b5cf6", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"];

function roleLabel(role: PersonRole) {
  return role === "branch_lead" ? "Branch lead" : "Counter staff";
}

function roleClass(role: PersonRole) {
  return role === "branch_lead"
    ? "bg-violet-50 text-violet-700 ring-violet-200"
    : "bg-sky-50 text-sky-700 ring-sky-200";
}

function statusClass(status: PersonStatus) {
  return status === "active"
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
    : "bg-slate-100 text-slate-600 ring-slate-200";
}

function PeoplePieChart({ rows }: { rows: PersonRow[] }) {
  const leads = rows.filter((r) => r.role === "branch_lead").length;
  const staff = rows.filter((r) => r.role === "counter_staff").length;
  const inactive = rows.filter((r) => r.status === "inactive").length;
  const data = [
    { label: "Branch leads", value: leads },
    { label: "Counter staff", value: staff },
    { label: "Inactive", value: inactive },
  ].filter((d) => d.value > 0);

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
        Roles breakdown
      </h3>
      {total === 0 ? (
        <p className="font-body mt-8 text-center text-sm text-muted">No people yet</p>
      ) : (
        <>
          <div className="mt-3 flex items-center justify-center">
            <svg viewBox="0 0 120 120" className="size-48 sm:size-56" role="img" aria-label="Roles">
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

export function AdminPeopleView() {
  const { admin } = useAdminSession();
  const operator = getAdminOperator(admin);
  const companyName = operator
    ? OPERATOR_REPORT_BRAND[operator].companyName
    : "Your transport";

  const [rows, setRows] = useState<PersonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | PersonRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | PersonStatus>("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<PersonRow | null>(null);

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
        const people = await fetchAdminPeople();
        if (cancelled) return;
        setRows(
          people.map((person) => ({
            id: person.id,
            name: person.displayName,
            phone: person.phone,
            email: person.email,
            role: person.role === "station_lead" ? "branch_lead" : "counter_staff",
            stationId: person.stationId,
            stationName: person.stationName,
            stationCode: person.stationCode,
            city: person.location?.split("·")[0]?.trim() || person.stationName,
            status: person.active ? "active" : "inactive",
          })),
        );
      } catch (error) {
        if (!cancelled) {
          void showValidationAlert({
            title: "Unable to load people",
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
      if (roleFilter !== "all" && row.role !== roleFilter) return false;
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (cityFilter !== "all" && row.city !== cityFilter) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        row.phone.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.stationName.toLowerCase().includes(q) ||
        row.stationCode.toLowerCase().includes(q) ||
        row.city.toLowerCase().includes(q)
      );
    });
  }, [rows, query, roleFilter, statusFilter, cityFilter]);

  if (!operator) {
    return (
      <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <h1 className="font-display text-xl font-bold text-foreground">Roles directory</h1>
        <p className="font-body mt-2 text-sm text-muted">
          Complete Admin setup first so HQ is locked to your transport service.
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

  const leadCount = rows.filter((r) => r.role === "branch_lead").length;
  const staffCount = rows.filter((r) => r.role === "counter_staff").length;
  const activeCount = rows.filter((r) => r.status === "active").length;
  const inactiveCount = rows.filter((r) => r.status === "inactive").length;

  const toggleStatus = async (person: PersonRow) => {
    const next: PersonStatus = person.status === "active" ? "inactive" : "active";
    try {
      await setAdminPersonActiveApi(person.id, next === "active");
      setRows((prev) =>
        prev.map((row) => (row.id === person.id ? { ...row, status: next } : row)),
      );
      setSelected((prev) => (prev?.id === person.id ? { ...prev, status: next } : prev));
      await showSuccessAlert({
        title: next === "active" ? "Account activated" : "Account deactivated",
        text: `${person.name} is now ${next}.`,
        confirmButtonColor: OPERATOR_ACCENT[operator],
      });
    } catch (error) {
      await showValidationAlert({
        title: "Unable to update account",
        text: error instanceof Error ? error.message : "Try again.",
      });
    }
  };

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Roles directory
            </h1>
            <p className="font-body mt-1 text-sm text-muted">
              All leads and counter staff across {companyName} branches.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/leads"
              className="font-display inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-foreground hover:border-[var(--staff-accent)]"
            >
              <UserCog className="size-4" />
              Branch leads
            </Link>
            <Link
              href="/admin/branches"
              className="font-display inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white"
              style={{ background: "var(--staff-accent)" }}
            >
              <Building2 className="size-4" />
              All stations
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "People", value: rows.length, icon: Users },
            { label: "Branch leads", value: leadCount, icon: UserCog },
            { label: "Counter staff", value: staffCount, icon: Shield },
            { label: "Active", value: activeCount, icon: Users },
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
                  placeholder="Search name, phone, station…"
                  className="font-body w-full rounded-xl border border-border bg-white py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-[var(--staff-accent)]"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value as "all" | PersonRole);
                  setPage(1);
                }}
                className="font-body rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-[var(--staff-accent)]"
              >
                <option value="all">All roles</option>
                <option value="branch_lead">Branch leads</option>
                <option value="counter_staff">Counter staff</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as "all" | PersonStatus);
                  setPage(1);
                }}
                className="font-body rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-[var(--staff-accent)]"
              >
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
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
            </div>

            {loading ? (
              <p className="font-body px-4 py-12 text-center text-sm text-muted sm:px-5">
                Loading roles directory…
              </p>
            ) : filtered.length === 0 ? (
              <p className="font-body px-4 py-12 text-center text-sm text-muted sm:px-5">
                No people match your filters.
              </p>
            ) : (
              <>
                <div className="max-h-[520px] overflow-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-[#0b1220] text-[11px] uppercase tracking-wider text-white">
                      <tr>
                        <th className="w-10 px-3 py-2.5 font-semibold sm:px-4">#</th>
                        <th className="px-3 py-2.5 font-semibold">User</th>
                        <th className="px-3 py-2.5 font-semibold">Role</th>
                        <th className="px-3 py-2.5 font-semibold">Station</th>
                        <th className="px-3 py-2.5 font-semibold">City</th>
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
                            <p className="font-body text-[10px] text-muted">{row.phone}</p>
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
                                roleClass(row.role),
                              )}
                            >
                              {roleLabel(row.role)}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="font-medium text-foreground">{row.stationName}</p>
                            <p className="font-mono text-[10px] text-muted">{row.stationCode}</p>
                          </td>
                          <td className="px-3 py-2.5 text-muted">{row.city}</td>
                          <td className="px-3 py-2.5">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
                                statusClass(row.status),
                              )}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 sm:px-4">
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelected(row)}
                                className="font-display rounded-lg border border-border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-foreground hover:border-[var(--staff-accent)]"
                              >
                                View
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleStatus(row)}
                                className={cn(
                                  "font-display rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide",
                                  row.status === "active"
                                    ? "border border-amber-300 bg-amber-50 text-amber-800"
                                    : "text-white",
                                )}
                                style={
                                  row.status === "inactive"
                                    ? { background: "var(--staff-accent)" }
                                    : undefined
                                }
                              >
                                {row.status === "active" ? "Deactivate" : "Activate"}
                              </button>
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
                    {inactiveCount > 0 ? (
                      <span className="ml-2 text-muted">· {inactiveCount} inactive</span>
                    ) : null}
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
            <PeoplePieChart rows={filtered.length ? filtered : rows} />
          </aside>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
          <div className="absolute inset-0" onClick={() => setSelected(null)} aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-detail-title"
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface shadow-xl"
          >
            <div
              className="relative px-5 pb-5 pt-5 sm:px-6 sm:pt-6"
              style={{
                background:
                  "linear-gradient(135deg, var(--staff-accent-muted) 0%, #ffffff 55%)",
              }}
            >
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="absolute right-3 top-3 rounded-lg p-1.5 text-muted hover:bg-white/80 hover:text-foreground"
              >
                <X className="size-4" />
              </button>

              <div className="flex items-start gap-4 pr-8">
                <div
                  className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-sm"
                  style={{ background: "var(--staff-accent)" }}
                  aria-hidden
                >
                  {selected.name
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase() ?? "")
                    .join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <h2
                    id="user-detail-title"
                    className="font-display text-lg font-bold tracking-tight text-foreground"
                  >
                    {selected.name}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
                        roleClass(selected.role),
                      )}
                    >
                      {roleLabel(selected.role)}
                    </span>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
                        statusClass(selected.status),
                      )}
                    >
                      {selected.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t border-border px-5 py-5 sm:px-6">
              <section>
                <h3 className="font-display text-[11px] font-bold uppercase tracking-wider text-muted">
                  Contact
                </h3>
                <ul className="mt-2 space-y-2">
                  <li className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-[var(--staff-accent)] ring-1 ring-border">
                      <Phone className="size-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-body text-[10px] uppercase tracking-wide text-muted">
                        Phone
                      </p>
                      <p className="font-display text-sm font-semibold text-foreground">
                        {selected.phone}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-[var(--staff-accent)] ring-1 ring-border">
                      <Mail className="size-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-body text-[10px] uppercase tracking-wide text-muted">
                        Email
                      </p>
                      <p className="font-display truncate text-sm font-semibold text-foreground">
                        {selected.email || "Not set"}
                      </p>
                    </div>
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="font-display text-[11px] font-bold uppercase tracking-wider text-muted">
                  Assignment
                </h3>
                <div className="mt-2 rounded-xl border border-border bg-white px-3 py-3">
                  <div className="flex items-start gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--staff-accent-muted)] text-[var(--staff-accent)]">
                      <Building2 className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-sm font-bold text-foreground">
                        {selected.stationName}
                      </p>
                      <p className="font-mono mt-0.5 text-[11px] text-muted">
                        {selected.stationCode}
                      </p>
                      <p className="font-body mt-2 inline-flex items-center gap-1 text-xs text-muted">
                        <MapPin className="size-3.5 shrink-0" />
                        {selected.city}
                      </p>
                    </div>
                  </div>
                  {selected.role === "branch_lead" ? (
                    <p className="font-body mt-3 border-t border-border pt-3 text-[11px] text-muted">
                      Manages staff and parcels for this station only.
                    </p>
                  ) : (
                    <p className="font-body mt-3 border-t border-border pt-3 text-[11px] text-muted">
                      Counter staff at this station — reports to the branch lead.
                    </p>
                  )}
                </div>
              </section>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border bg-slate-50/80 px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="font-display rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-foreground"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => toggleStatus(selected)}
                className={cn(
                  "font-display rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white",
                  selected.status === "active" ? "bg-red-600 hover:bg-red-700" : "",
                )}
                style={
                  selected.status === "inactive"
                    ? { background: "var(--staff-accent)" }
                    : undefined
                }
              >
                {selected.status === "active" ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
