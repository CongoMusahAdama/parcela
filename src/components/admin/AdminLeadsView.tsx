"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Send,
  UserCog,
  UserPlus,
  X,
} from "lucide-react";
import { useAdminSession } from "@/components/admin/AdminOperatorShell";
import {
  fetchAdminLeads,
  fetchAdminStations,
  removeAdminLeadApi,
  sendAdminLeadCredentialsApi,
  upsertAdminLeadApi,
  type AdminLeadAccount,
  type AdminStationRow,
} from "@/lib/admin-api";
import { getAdminAccentColor, getAdminOperator, getAdminOperatorName } from "@/lib/admin-operator";
import { showConfirmDialog, showSuccessAlert, showValidationAlert } from "@/lib/sweetalert";
import type { Operator } from "@/types/parcel";
import { cn } from "@/lib/utils";

type LeadRow = {
  stationId: string;
  stationName: string;
  stationCode: string;
  city: string;
  leadName: string | null;
  leadPhone: string;
  leadEmail: string;
  /** Whether HQ has sent login details in this session. */
  credentialsSent: boolean;
};

const PAGE_SIZE = 8;

const PIE_COLORS = ["#10b981", "#f59e0b", "#0ea5e9", "#8b5cf6", "#ef4444", "#14b8a6"];

const inputClass =
  "font-body w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-[var(--staff-accent)]";

const labelClass =
  "font-display mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted";

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("233") && digits.length === 12) return `0${digits.slice(3)}`;
  if (digits.length === 9 && !digits.startsWith("0")) return `0${digits}`;
  return digits;
}

function formatPhoneDisplay(phone: string): string {
  const n = normalizePhone(phone);
  if (n.length === 10) return `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
  return phone.trim();
}

function buildLeadRows(
  stations: AdminStationRow[],
  leads: AdminLeadAccount[],
  prev?: LeadRow[],
): LeadRow[] {
  const byStation = new Map(
    leads.filter((l) => l.active).map((l) => [l.stationId, l]),
  );
  const prevByStation = new Map((prev ?? []).map((r) => [r.stationId, r]));

  return stations.map((station) => {
    const lead = byStation.get(station.id);
    const previous = prevByStation.get(station.id);
    return {
      stationId: station.id,
      stationName: station.name,
      stationCode: station.code,
      city: station.city,
      leadName: lead?.displayName ?? station.leadName ?? null,
      leadPhone: lead?.phone ?? station.leadPhone ?? "",
      leadEmail: lead?.email ?? station.leadEmail ?? "",
      credentialsSent: previous?.credentialsSent ?? false,
    };
  });
}

function LeadsPieChart({ rows }: { rows: LeadRow[] }) {
  const assigned = rows.filter((r) => r.leadName).length;
  const unassigned = rows.length - assigned;
  const data = [
    { label: "Lead assigned", value: assigned },
    { label: "Unassigned", value: unassigned },
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
        Lead coverage
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
              aria-label="Lead coverage"
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

export function AdminLeadsView() {
  const { admin } = useAdminSession();
  const operator = getAdminOperator(admin);
  const companyName = getAdminOperatorName(admin);
  const accentColor = getAdminAccentColor(admin);

  const [rows, setRows] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [coverageFilter, setCoverageFilter] = useState<"all" | "assigned" | "unassigned">("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<LeadRow | null>(null);
  const [isCreate, setIsCreate] = useState(false);
  const [draft, setDraft] = useState({
    stationId: "",
    name: "",
    phone: "",
    email: "",
  });
  const [saving, setSaving] = useState(false);
  const [sendAfterSave, setSendAfterSave] = useState(true);
  const [credentialsPreview, setCredentialsPreview] = useState<{
    name: string;
    phone: string;
    stationName: string;
    stationCode: string;
    smsSent: boolean;
  } | null>(null);

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
        const [stations, leads] = await Promise.all([
          fetchAdminStations(),
          fetchAdminLeads(),
        ]);
        if (cancelled) return;
        setRows((prev) => buildLeadRows(stations, leads, prev));
      } catch (error) {
        if (!cancelled) {
          void showValidationAlert({
            title: "Unable to load branch leads",
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

  const unassignedStations = useMemo(
    () => rows.filter((r) => !r.leadName),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (cityFilter !== "all" && row.city !== cityFilter) return false;
      if (coverageFilter === "assigned" && !row.leadName) return false;
      if (coverageFilter === "unassigned" && row.leadName) return false;
      if (!q) return true;
      return (
        row.stationName.toLowerCase().includes(q) ||
        row.stationCode.toLowerCase().includes(q) ||
        row.city.toLowerCase().includes(q) ||
        (row.leadName?.toLowerCase().includes(q) ?? false) ||
        row.leadPhone.toLowerCase().includes(q)
      );
    });
  }, [rows, query, cityFilter, coverageFilter]);

  if (!operator) {
    return (
      <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <h1 className="font-display text-xl font-bold text-foreground">Branch leads</h1>
        <p className="font-body mt-2 text-sm text-muted">
          Complete Admin setup first so leads are created only for your transport.
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

  const assignedCount = rows.filter((r) => r.leadName).length;
  const unassignedCount = rows.length - assignedCount;

  const openCreate = () => {
    setIsCreate(true);
    setEditing(null);
    setSendAfterSave(true);
    setDraft({
      stationId: unassignedStations[0]?.stationId ?? "",
      name: "",
      phone: "",
      email: "",
    });
  };

  const openEdit = (row: LeadRow) => {
    setIsCreate(false);
    setEditing(row);
    setSendAfterSave(false);
    setDraft({
      stationId: row.stationId,
      name: row.leadName ?? "",
      phone: row.leadPhone,
      email: row.leadEmail,
    });
  };

  const closePanel = () => {
    setEditing(null);
    setIsCreate(false);
    setDraft({ stationId: "", name: "", phone: "", email: "" });
  };

  const sendLoginDetails = async (row: LeadRow) => {
    const phone = formatPhoneDisplay(row.leadPhone);
    const confirmed = await showConfirmDialog({
      title: "Send login details?",
      text: `SMS will go to ${phone} with a temporary PIN for ${row.stationName}. The lead will only see staff and parcels for that branch.`,
      confirmText: "Send SMS",
      cancelText: "Not now",
      confirmButtonColor: accentColor,
    });
    if (!confirmed) return false;

    try {
      const result = await sendAdminLeadCredentialsApi(row.stationId);
      setRows((prev) =>
        prev.map((r) =>
          r.stationId === row.stationId
            ? {
                ...r,
                credentialsSent: true,
                leadName: result.lead.displayName,
                leadPhone: result.lead.phone,
                leadEmail: result.lead.email,
              }
            : r,
        ),
      );

      setCredentialsPreview({
        name: result.lead.displayName,
        phone: formatPhoneDisplay(result.lead.phone),
        stationName: row.stationName,
        stationCode: row.stationCode,
        smsSent: result.smsSent,
      });

      await showSuccessAlert({
        title: result.smsSent ? "Login sent" : "Credentials generated",
        text: result.smsSent
          ? `Login details were sent to ${phone}. ${result.lead.displayName} is locked to ${row.stationName} (${row.stationCode}).`
          : `A new PIN was generated for ${result.lead.displayName}, but SMS may be unavailable. Ask them to check their phone or resend later.`,
        confirmButtonColor: accentColor,
      });
      return true;
    } catch (error) {
      await showValidationAlert({
        title: "Unable to send login",
        text: error instanceof Error ? error.message : "Try again.",
      });
      return false;
    }
  };

  const saveLead = async () => {
    const name = draft.name.trim();
    const phoneRaw = draft.phone.trim();
    const phone = normalizePhone(phoneRaw);
    const stationId = draft.stationId;

    if (!stationId) {
      void showValidationAlert({
        title: "Select a branch",
        text: "Every branch lead must be linked to one station. That is the branch they manage after login.",
      });
      return;
    }
    if (!name || phone.length < 10) {
      void showValidationAlert({
        title: "Lead details missing",
        text: "Enter the lead name and a valid Ghana phone number. Email is optional.",
      });
      return;
    }

    const station = rows.find((r) => r.stationId === stationId);
    if (!station) return;

    const creating = isCreate || !editing?.leadName;

    setSaving(true);
    try {
      const result = await upsertAdminLeadApi({
        stationId,
        leadName: name,
        leadPhone: phoneRaw,
        leadEmail: draft.email.trim() || undefined,
      });

      const nextRow: LeadRow = {
        stationId,
        stationName: station.stationName,
        stationCode: station.stationCode,
        city: station.city,
        leadName: result.lead.displayName,
        leadPhone: result.lead.phone,
        leadEmail: result.lead.email,
        credentialsSent: creating ? Boolean(result.smsSent) : Boolean(editing?.credentialsSent),
      };

      setRows((prev) =>
        prev.map((row) => (row.stationId === stationId ? nextRow : row)),
      );

      await showSuccessAlert({
        title: creating ? "Lead account created" : "Lead updated",
        text: creating
          ? `${name} is now the branch lead for ${station.stationName}. ${
              result.smsSent
                ? "Login PIN was sent by SMS."
                : "A PIN was generated — use Send login if SMS did not go out."
            }`
          : `${name} remains the branch lead for ${station.stationName}. A new PIN was generated${
              result.smsSent ? " and sent by SMS" : ""
            }.`,
        confirmButtonColor: accentColor,
      });
      closePanel();

      if (creating && sendAfterSave && !result.smsSent) {
        await sendLoginDetails(nextRow);
      } else if (creating && result.smsSent) {
        setCredentialsPreview({
          name: result.lead.displayName,
          phone: formatPhoneDisplay(result.lead.phone),
          stationName: station.stationName,
          stationCode: station.stationCode,
          smsSent: true,
        });
        setRows((prev) =>
          prev.map((r) =>
            r.stationId === stationId ? { ...r, credentialsSent: true } : r,
          ),
        );
      }
    } catch (error) {
      await showValidationAlert({
        title: "Unable to save lead",
        text: error instanceof Error ? error.message : "Try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const clearLead = async (row: LeadRow) => {
    const confirmed = await showConfirmDialog({
      title: "Remove branch lead?",
      text: `${row.stationName} will have no lead until you assign someone else.`,
      confirmText: "Remove lead",
      cancelText: "Cancel",
      icon: "warning",
      confirmButtonColor: "#dc2626",
    });
    if (!confirmed) return;

    try {
      await removeAdminLeadApi(row.stationId);
      setRows((prev) =>
        prev.map((r) =>
          r.stationId === row.stationId
            ? {
                ...r,
                leadName: null,
                leadPhone: "",
                leadEmail: "",
                credentialsSent: false,
              }
            : r,
        ),
      );
      await showSuccessAlert({
        title: "Lead removed",
        text: `${row.stationName} is unassigned. You can assign a new lead anytime.`,
        confirmButtonColor: accentColor,
      });
    } catch (error) {
      await showValidationAlert({
        title: "Unable to remove lead",
        text: error instanceof Error ? error.message : "Try again.",
      });
    }
  };

  const panelOpen = isCreate || editing !== null;
  const pendingSendCount = rows.filter((r) => r.leadName && !r.credentialsSent).length;

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Branch leads
            </h1>
            <p className="font-body mt-1 text-sm text-muted">
              Create lead accounts here (pick a branch, then send login). Admin setup reads this
              list to check coverage — each lead only manages staff and parcels at their station.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/branches"
              className="font-display inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-foreground hover:border-[var(--staff-accent)]"
            >
              <Building2 className="size-4" />
              All stations
            </Link>
            <button
              type="button"
              onClick={openCreate}
              disabled={unassignedStations.length === 0}
              className="font-display inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: "var(--staff-accent)" }}
            >
              <Plus className="size-4" />
              Create lead account
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Stations", value: rows.length, icon: Building2 },
            { label: "Leads assigned", value: assignedCount, icon: UserCog },
            { label: "Unassigned", value: unassignedCount, icon: UserPlus },
            {
              label: "Login not sent",
              value: pendingSendCount,
              icon: Send,
            },
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
                  placeholder="Search lead, station, phone, city…"
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
                value={coverageFilter}
                onChange={(e) => {
                  setCoverageFilter(e.target.value as "all" | "assigned" | "unassigned");
                  setPage(1);
                }}
                className="font-body rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-[var(--staff-accent)]"
              >
                <option value="all">All coverage</option>
                <option value="assigned">Assigned</option>
                <option value="unassigned">Unassigned</option>
              </select>
            </div>

            {loading ? (
              <p className="font-body px-4 py-12 text-center text-sm text-muted sm:px-5">
                Loading branch leads…
              </p>
            ) : filtered.length === 0 ? (
              <p className="font-body px-4 py-12 text-center text-sm text-muted sm:px-5">
                No leads match your filters.
              </p>
            ) : (
              <>
                <div className="max-h-[520px] overflow-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-[#0b1220] text-[11px] uppercase tracking-wider text-white">
                      <tr>
                        <th className="w-10 px-3 py-2.5 font-semibold sm:px-4">#</th>
                        <th className="px-3 py-2.5 font-semibold">Lead</th>
                        <th className="px-3 py-2.5 font-semibold">Phone</th>
                        <th className="px-3 py-2.5 font-semibold">Assigned branch</th>
                        <th className="px-3 py-2.5 font-semibold">Login</th>
                        <th className="px-3 py-2.5 font-semibold sm:px-4">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map((row, index) => (
                        <tr key={row.stationId} className="border-t border-border">
                          <td className="px-3 py-2.5 font-medium text-muted sm:px-4">
                            {pageStart + index + 1}
                          </td>
                          <td className="px-3 py-2.5">
                            {row.leadName ? (
                              <>
                                <p className="font-display font-semibold text-foreground">
                                  {row.leadName}
                                </p>
                                {row.leadEmail ? (
                                  <p className="font-body text-[10px] text-muted">{row.leadEmail}</p>
                                ) : null}
                              </>
                            ) : (
                              <span className="font-medium text-amber-700">Unassigned</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-muted">
                            {row.leadPhone || "—"}
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="font-medium text-foreground">{row.stationName}</p>
                            <p className="font-mono text-[10px] text-muted">
                              {row.stationCode} · {row.city}
                            </p>
                          </td>
                          <td className="px-3 py-2.5">
                            {row.leadName ? (
                              <span
                                className={cn(
                                  "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
                                  row.credentialsSent
                                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                    : "bg-amber-50 text-amber-800 ring-amber-200",
                                )}
                              >
                                {row.credentialsSent ? "Sent" : "Not sent"}
                              </span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 sm:px-4">
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEdit(row)}
                                className="font-display rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white"
                                style={{ background: "var(--staff-accent)" }}
                              >
                                {row.leadName ? "Edit" : "Create"}
                              </button>
                              {row.leadName ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      sendLoginDetails(row)
                                    }
                                    className="font-display inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-foreground hover:border-[var(--staff-accent)]"
                                  >
                                    <Send className="size-3" />
                                    {row.credentialsSent ? "Resend" : "Send login"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => clearLead(row)}
                                    className="font-display rounded-lg border border-border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-foreground hover:border-red-300 hover:text-red-700"
                                  >
                                    Remove
                                  </button>
                                </>
                              ) : null}
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
            <LeadsPieChart rows={filtered.length ? filtered : rows} />
          </aside>
        </div>
      </div>

      {panelOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
          <div className="absolute inset-0" onClick={closePanel} aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-action-title"
            className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-surface p-5 shadow-xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="lead-action-title"
                  className="font-display text-base font-bold text-foreground"
                >
                  {isCreate || !editing?.leadName ? "Create lead account" : "Edit branch lead"}
                </h2>
                <p className="font-body mt-1 text-sm text-muted">
                  Select the branch first. After login, this lead only sees staff and parcels for
                  that station.
                </p>
              </div>
              <button
                type="button"
                onClick={closePanel}
                aria-label="Close"
                className="rounded-lg p-1.5 text-muted hover:bg-slate-100 hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <div>
                <label htmlFor="lead-station" className={labelClass}>
                  Assigned branch
                </label>
                <select
                  id="lead-station"
                  value={draft.stationId}
                  disabled={!isCreate && Boolean(editing?.leadName)}
                  onChange={(e) => setDraft((d) => ({ ...d, stationId: e.target.value }))}
                  className={cn(
                    inputClass,
                    !isCreate && editing?.leadName && "opacity-70",
                  )}
                >
                  <option value="">Select a station…</option>
                  {(isCreate || !editing?.leadName
                    ? unassignedStations
                    : rows.filter((r) => r.stationId === editing.stationId)
                  ).map((row) => (
                    <option key={row.stationId} value={row.stationId}>
                      {row.stationName} · {row.city} ({row.stationCode})
                    </option>
                  ))}
                </select>
                <p className="font-body mt-1.5 text-[11px] text-muted">
                  This is the only branch the lead can manage after they sign in.
                </p>
              </div>
              <div>
                <label htmlFor="lead-name" className={labelClass}>
                  Lead name
                </label>
                <input
                  id="lead-name"
                  type="text"
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Ama Mensah"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="lead-phone" className={labelClass}>
                  Phone number
                </label>
                <input
                  id="lead-phone"
                  type="tel"
                  value={draft.phone}
                  onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                  placeholder="024 000 0000"
                  className={inputClass}
                />
                <p className="font-body mt-1.5 text-[11px] text-muted">
                  Used as their login ID. A temporary PIN is generated and sent by SMS (never shown in HQ).
                </p>
              </div>
              <div>
                <label htmlFor="lead-email" className={labelClass}>
                  Email{" "}
                  <span className="normal-case tracking-normal text-muted/70">(optional)</span>
                </label>
                <input
                  id="lead-email"
                  type="email"
                  value={draft.email}
                  onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                  placeholder="lead@company.com"
                  className={inputClass}
                />
              </div>
              {(isCreate || !editing?.leadName) && (
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-white px-3.5 py-3">
                  <input
                    type="checkbox"
                    checked={sendAfterSave}
                    onChange={(e) => setSendAfterSave(e.target.checked)}
                    className="mt-0.5 size-4 rounded border-border"
                  />
                  <span>
                    <span className="font-display block text-xs font-bold uppercase tracking-wide text-foreground">
                      Send login after create
                    </span>
                    <span className="font-body mt-0.5 block text-[11px] text-muted">
                      SMS the temporary PIN to the lead’s phone so they can sign in to their branch.
                    </span>
                  </span>
                </label>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closePanel}
                className="font-display rounded-xl border border-border px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveLead}
                disabled={saving}
                className="font-display inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white disabled:opacity-60"
                style={{ background: "var(--staff-accent)" }}
              >
                <UserCog className="size-4" />
                {saving
                  ? "Saving…"
                  : isCreate || !editing?.leadName
                    ? "Create & bind to branch"
                    : "Save lead"}
              </button>
            </div>
          </div>
        </div>
      )}

      {credentialsPreview && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
          <div
            className="absolute inset-0"
            onClick={() => setCredentialsPreview(null)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-bold text-foreground">
                  {credentialsPreview.smsSent ? "Login details sent" : "Login details ready"}
                </h2>
                <p className="font-body mt-1 text-sm text-muted">
                  {credentialsPreview.smsSent
                    ? "The temporary PIN was sent by SMS. It is not shown here for security."
                    : "SMS may be unavailable. Use Send login again when messaging is online."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCredentialsPreview(null)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-muted hover:bg-slate-100 hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <dl className="mt-5 space-y-2 rounded-xl border border-border bg-white p-4">
              {[
                ["Lead", credentialsPreview.name],
                ["Branch", `${credentialsPreview.stationName} (${credentialsPreview.stationCode})`],
                ["Phone / login", credentialsPreview.phone],
                ["PIN delivery", credentialsPreview.smsSent ? "Sent by SMS" : "Pending SMS"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-3 text-sm">
                  <dt className="font-body text-muted">{label}</dt>
                  <dd className="font-display font-bold text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="font-body mt-3 text-[11px] text-muted">
              Portal: /lead/login — they will only see staff and parcels for this branch.
            </p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setCredentialsPreview(null)}
                className="font-display rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white"
                style={{ background: "var(--staff-accent)" }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
