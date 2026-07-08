"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Plus,
  RefreshCw,
  Rocket,
  Send,
  Trash2,
  UserCog,
} from "lucide-react";
import { OperatorLogo } from "@/components/brand/OperatorLogo";
import { useAdminSession } from "@/components/admin/AdminOperatorShell";
import {
  fetchAdminLeads,
  sendAdminLeadCredentialsApi,
  type AdminLeadAccount,
} from "@/lib/admin-api";
import { completeAdminSetup } from "@/lib/admin-auth";
import { getAdminOperator } from "@/lib/admin-operator";
import { fetchStations } from "@/lib/api";
import { OPERATOR_ACCENT, OPERATOR_REPORT_BRAND } from "@/lib/operators";
import { showConfirmDialog, showSuccessAlert, showValidationAlert } from "@/lib/sweetalert";
import type { Operator } from "@/types/parcel";
import { cn } from "@/lib/utils";

type SetupBranch = {
  id: string;
  name: string;
  code: string;
  city: string;
};

type StationLeadCoverage = {
  stationId: string;
  stationName: string;
  stationCode: string;
  city: string;
  lead: {
    leadName: string;
    leadPhone: string;
    leadEmail: string;
    credentialsSent: boolean;
  } | null;
};

/** Fallback only when session has no operator yet (should not happen for seeded HQ). */
const SETUP_OPERATOR: Operator = "VIP";

const STEPS = [
  { id: 1, label: "Branches", icon: Building2 },
  { id: 2, label: "Branch leads", icon: UserCog },
  { id: 3, label: "Review & activate", icon: Rocket },
] as const;

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

type PieDatum = { label: string; value: number };

function getSetupPieBreakdown(
  step: number,
  branches: SetupBranch[],
  coverage: StationLeadCoverage[],
): { title: string; data: PieDatum[] } {
  if (step === 2) {
    const withLead = coverage.filter((c) => c.lead).length;
    const withoutLead = coverage.length - withLead;
    return {
      title: "Lead coverage",
      data: [
        { label: "Lead assigned", value: withLead },
        { label: "No lead yet", value: withoutLead },
      ].filter((d) => d.value > 0),
    };
  }

  if (step === 3) {
    const loginSent = coverage.filter((c) => c.lead?.credentialsSent).length;
    const loginPending = coverage.filter((c) => c.lead && !c.lead.credentialsSent).length;
    const noLead = coverage.filter((c) => !c.lead).length;
    return {
      title: "Setup readiness",
      data: [
        { label: "Login sent", value: loginSent },
        { label: "Login pending", value: loginPending },
        { label: "No lead yet", value: noLead },
      ].filter((d) => d.value > 0),
    };
  }

  const byCity = new Map<string, number>();
  for (const branch of branches) {
    byCity.set(branch.city, (byCity.get(branch.city) ?? 0) + 1);
  }
  return {
    title: "Branches by city",
    data: [...byCity.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value),
  };
}

function SetupPieChart({ title, data }: { title: string; data: PieDatum[] }) {
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
      {total === 0 ? (
        <p className="font-body mt-8 text-center text-sm text-muted">No data yet</p>
      ) : (
        <>
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
                {total.toLocaleString("en-GH")}
              </text>
              <text x={cx} y={cy + 12} textAnchor="middle" fontSize="7" fill="#64748b">
                TOTAL
              </text>
            </svg>
          </div>
          <ul className="mt-4 max-h-[220px] space-y-2 overflow-y-auto">
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

function buildCoverage(
  branches: SetupBranch[],
  leads: AdminLeadAccount[],
  prev?: StationLeadCoverage[],
): StationLeadCoverage[] {
  const byStation = new Map(leads.filter((l) => l.active).map((l) => [l.stationId, l]));
  const prevByStation = new Map((prev ?? []).map((c) => [c.stationId, c]));
  return branches.map((branch) => {
    const lead = byStation.get(branch.id);
    const previous = prevByStation.get(branch.id);
    return {
      stationId: branch.id,
      stationName: branch.name,
      stationCode: branch.code,
      city: branch.city,
      lead: lead
        ? {
            leadName: lead.displayName,
            leadPhone: lead.phone,
            leadEmail: lead.email,
            credentialsSent: previous?.lead?.credentialsSent ?? false,
          }
        : null,
    };
  });
}

export function AdminSetupView() {
  const { admin } = useAdminSession();
  const operator: Operator = getAdminOperator(admin) ?? SETUP_OPERATOR;
  const companyName = OPERATOR_REPORT_BRAND[operator].companyName;

  const [step, setStep] = useState(1);
  const [branches, setBranches] = useState<SetupBranch[]>([]);
  const [coverage, setCoverage] = useState<StationLeadCoverage[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [branchesError, setBranchesError] = useState<string | null>(null);
  const [branchDraft, setBranchDraft] = useState({ name: "", code: "", city: "" });
  const [activating, setActivating] = useState(false);
  const [branchReloadKey, setBranchReloadKey] = useState(0);

  const refreshCoverage = useCallback(async (branchList: SetupBranch[]) => {
    try {
      const leads = await fetchAdminLeads();
      setCoverage((prev) => buildCoverage(branchList, leads, prev));
    } catch {
      // Keep previous coverage if refresh fails.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadOperatorBranches() {
      setBranchesLoading(true);
      setBranchesError(null);
      try {
        // All live terminals for this transport only (VIP → VIP stations, STC → STC).
        const stations = await fetchStations({ operator });
        if (cancelled) return;
        const nextBranches = stations
          .filter((station) => station.operator === operator)
          .map((station) => ({
            id: station.id,
            name: station.name,
            code: station.code,
            city: station.city,
          }))
          .sort(
            (a, b) =>
              a.city.localeCompare(b.city) ||
              a.name.localeCompare(b.name) ||
              a.code.localeCompare(b.code),
          );
        setBranches(nextBranches);
        try {
          const leads = await fetchAdminLeads();
          if (cancelled) return;
          setCoverage(buildCoverage(nextBranches, leads));
        } catch {
          if (!cancelled) setCoverage(buildCoverage(nextBranches, []));
        }
      } catch (error) {
        if (!cancelled) {
          setBranches([]);
          setCoverage([]);
          setBranchesError(
            error instanceof Error
              ? error.message
              : `Unable to load ${operator} branches from the system.`,
          );
        }
      } finally {
        if (!cancelled) setBranchesLoading(false);
      }
    }

    void loadOperatorBranches();
    return () => {
      cancelled = true;
    };
  }, [operator, branchReloadKey]);

  useEffect(() => {
    if (step !== 2 && step !== 3) return;
    void refreshCoverage(branches);
  }, [step, branches, refreshCoverage]);

  useEffect(() => {
    const onFocus = () => {
      if (step === 2 || step === 3) {
        void refreshCoverage(branches);
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [step, branches, refreshCoverage]);

  const isConfigured = admin.operatorConfigured;
  const leadsAssigned = coverage.filter((c) => c.lead).length;
  const missingLeads = coverage.length - leadsAssigned;

  const addBranch = () => {
    const name = branchDraft.name.trim();
    const code = branchDraft.code.trim().toUpperCase();
    const city = branchDraft.city.trim();

    if (!name || !code || !city) {
      void showValidationAlert({
        title: "Branch details missing",
        text: "Enter the branch name, a short code, and the city before adding it.",
      });
      return;
    }
    if (branches.some((b) => b.code === code)) {
      void showValidationAlert({
        title: "Duplicate branch code",
        text: `A branch with code ${code} is already on the list.`,
      });
      return;
    }

    setBranches((prev) => [
      ...prev,
      {
        id: `setup-${code}-${Date.now()}`,
        name,
        code,
        city,
      },
    ]);
    setBranchDraft({ name: "", code: "", city: "" });
  };

  const removeBranch = (id: string) => {
    setBranches((prev) => prev.filter((b) => b.id !== id));
  };

  const sendLeadLogin = async (row: StationLeadCoverage) => {
    if (!row.lead) {
      void showValidationAlert({
        title: "No lead account",
        text: "Create a lead for this branch on the Branch leads page first.",
      });
      return;
    }
    const confirmed = await showConfirmDialog({
      title: "Send login details?",
      text: `SMS will go to ${row.lead.leadPhone} with a temporary PIN. ${row.lead.leadName} will only manage staff and parcels at ${row.stationName}.`,
      confirmText: "Send SMS",
      cancelText: "Not now",
      confirmButtonColor: OPERATOR_ACCENT[operator],
    });
    if (!confirmed) return;

    try {
      const result = await sendAdminLeadCredentialsApi(row.stationId);
      setCoverage((prev) =>
        prev.map((c) =>
          c.stationId === row.stationId && c.lead
            ? { ...c, lead: { ...c.lead, credentialsSent: true } }
            : c,
        ),
      );
      await showSuccessAlert({
        title: result.smsSent ? "Login sent" : "Credentials generated",
        text: result.smsSent
          ? `Login sent to ${row.lead.leadPhone}. Branch: ${row.stationName} (${row.stationCode}).`
          : `A new PIN was generated for ${row.lead.leadName}, but SMS may be unavailable. Resend when messaging is online.`,
        confirmButtonColor: OPERATOR_ACCENT[operator],
      });
    } catch (error) {
      await showValidationAlert({
        title: "Unable to send login",
        text: error instanceof Error ? error.message : "Try again.",
      });
    }
  };

  const goNext = () => {
    if (step === 1 && branches.length === 0) {
      void showValidationAlert({
        title: "Add at least one branch",
        text: "Your network needs a first terminal before it can go live.",
      });
      return;
    }
    setStep((s) => Math.min(3, s + 1));
  };

  const activate = async () => {
    setActivating(true);
    try {
      await completeAdminSetup(operator);
      await showSuccessAlert({
        title: isConfigured ? "Setup updated" : "Application configured",
        text: isConfigured
          ? `${companyName} setup has been saved. Branches and lead coverage are up to date.`
          : `${companyName} is ready. Your HQ portal is now live with ${operator} branding.`,
        confirmText: isConfigured ? "Got it" : "Go to dashboard",
        confirmButtonColor: OPERATOR_ACCENT[operator],
      });
      if (!isConfigured) {
        window.location.assign("/admin/dashboard");
        return;
      }
      window.location.reload();
    } catch (error) {
      await showValidationAlert({
        title: "Unable to complete setup",
        text: error instanceof Error ? error.message : "Try again.",
      });
    } finally {
      setActivating(false);
    }
  };

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div>
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Admin setup
          </h1>
          <p className="font-body mt-1 text-sm text-muted">
            {isConfigured
              ? `Review live ${companyName} branches, confirm lead coverage, then save updates anytime.`
              : `Choose live branches for ${companyName}, confirm lead coverage, then activate.`}
          </p>
        </div>

        {isConfigured && (
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="size-5" strokeWidth={2.25} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-bold text-emerald-900">
                Application already configured
              </p>
              <p className="font-body text-[11px] text-emerald-800/80">
                {companyName} is live. You can still review branches and manage leads below.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/dashboard"
                className="font-display rounded-xl px-3.5 py-2 text-[10px] font-bold uppercase tracking-wide text-white"
                style={{ background: "var(--staff-accent)" }}
              >
                Dashboard
              </Link>
              <Link
                href="/admin/leads"
                className="font-display rounded-xl border border-emerald-300 bg-white px-3.5 py-2 text-[10px] font-bold uppercase tracking-wide text-emerald-900"
              >
                Branch leads
              </Link>
            </div>
          </div>
        )}

        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-sm">
          <div className="rounded-lg border border-border bg-white p-1.5">
            <OperatorLogo operator={operator} className="h-7" />
          </div>
          <div className="min-w-0">
            <p className="font-display truncate text-sm font-bold text-foreground">
              {companyName}
            </p>
            <p className="font-body text-[11px] text-muted">
              {branchesLoading
                ? `Loading ${operator} terminals…`
                : isConfigured
                  ? `${branches.length} ${operator} terminals across Ghana — edit anytime.`
                  : `${branches.length} ${operator} terminals loaded — branding applies when you activate.`}
            </p>
          </div>
          <span
            className="ml-auto size-4 shrink-0 rounded-full"
            style={{ background: OPERATOR_ACCENT[operator] }}
            aria-label="Accent colour"
          />
        </div>

        {/* Stepper */}
        <ol className="mt-4 flex items-center gap-2">
          {STEPS.map((s, index) => {
            const done = step > s.id;
            const active = step === s.id;
            return (
              <li key={s.id} className={cn("flex items-center gap-2", index > 0 && "flex-1")}>
                {index > 0 && (
                  <span
                    className={cn("h-px flex-1", done || active ? "bg-[var(--staff-accent)]" : "bg-border")}
                    aria-hidden
                  />
                )}
                <span
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide",
                    active
                      ? "text-white"
                      : done
                        ? "text-[var(--staff-accent)]"
                        : "bg-white text-muted ring-1 ring-inset ring-border",
                  )}
                  style={
                    active
                      ? { background: "var(--staff-accent)" }
                      : done
                        ? { background: "var(--staff-accent-muted)" }
                        : undefined
                  }
                >
                  {done ? <Check className="size-3.5" /> : <s.icon className="size-3.5" />}
                  <span className="hidden sm:inline">{s.label}</span>
                </span>
              </li>
            );
          })}
        </ol>

        <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex max-h-[min(70vh,640px)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          {step === 1 && (
            <section>
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
                Branches
              </h2>
              <p className="font-body mt-1 text-sm text-muted">
                All {operator} terminals across Ghana are loaded below. Remove any you do not need,
                or add a new one HQ opens later.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_7rem_1fr_auto]">
                <div>
                  <label htmlFor="setup-branch-name" className={labelClass}>
                    Branch name
                  </label>
                  <input
                    id="setup-branch-name"
                    type="text"
                    value={branchDraft.name}
                    onChange={(e) => setBranchDraft((d) => ({ ...d, name: e.target.value }))}
                    placeholder="Kaneshie Terminal"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="setup-branch-code" className={labelClass}>
                    Code
                  </label>
                  <input
                    id="setup-branch-code"
                    type="text"
                    value={branchDraft.code}
                    maxLength={8}
                    onChange={(e) =>
                      setBranchDraft((d) => ({ ...d, code: e.target.value.toUpperCase() }))
                    }
                    placeholder="VIP-KNH"
                    className={cn(inputClass, "font-mono uppercase")}
                  />
                </div>
                <div>
                  <label htmlFor="setup-branch-city" className={labelClass}>
                    City
                  </label>
                  <input
                    id="setup-branch-city"
                    type="text"
                    value={branchDraft.city}
                    onChange={(e) => setBranchDraft((d) => ({ ...d, city: e.target.value }))}
                    placeholder="Accra"
                    className={inputClass}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={addBranch}
                    className="font-display flex h-[42px] items-center gap-1.5 rounded-xl px-4 text-xs font-bold uppercase tracking-wide text-white"
                    style={{ background: "var(--staff-accent)" }}
                  >
                    <Plus className="size-4" />
                    Add
                  </button>
                </div>
              </div>

              {branchesLoading ? (
                <p className="font-body mt-5 rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
                  Loading all {operator} terminals from the system…
                </p>
              ) : branches.length > 0 ? (
                <div className="mt-5 overflow-hidden rounded-xl border border-border">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-[#0b1220] text-[11px] uppercase tracking-wider text-white">
                      <tr>
                        <th className="w-10 px-3 py-2.5 font-semibold">#</th>
                        <th className="px-3 py-2.5 font-semibold">Branch</th>
                        <th className="px-3 py-2.5 font-semibold">Code</th>
                        <th className="px-3 py-2.5 font-semibold">City</th>
                        <th className="w-12 px-3 py-2.5" aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {branches.map((branch, index) => (
                        <tr key={branch.id} className="border-t border-border">
                          <td className="px-3 py-2.5 font-medium text-muted">{index + 1}</td>
                          <td className="px-3 py-2.5 font-medium text-foreground">{branch.name}</td>
                          <td className="px-3 py-2.5 font-mono text-xs text-muted">{branch.code}</td>
                          <td className="px-3 py-2.5 text-muted">{branch.city}</td>
                          <td className="px-3 py-2.5">
                            <button
                              type="button"
                              onClick={() => removeBranch(branch.id)}
                              aria-label={`Remove ${branch.name}`}
                              className="rounded-lg p-1.5 text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="font-body mt-5 rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
                  <p>
                    {branchesError
                      ? branchesError
                      : `No ${operator} terminals found in the system — add your first branch above.`}
                  </p>
                  {branchesError ? (
                    <button
                      type="button"
                      onClick={() => setBranchReloadKey((key) => key + 1)}
                      className="font-display mt-3 inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-[10px] font-bold uppercase tracking-wide text-foreground"
                    >
                      <RefreshCw className="size-3.5" />
                      Retry
                    </button>
                  ) : null}
                </div>
              )}
            </section>
          )}

          {step === 2 && (
            <section>
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
                Branch lead coverage
              </h2>
              <p className="font-body mt-1 text-sm text-muted">
                Lead accounts are created on the Branch leads page. This step checks coverage for
                your selected branches and lets you send login details when a lead exists.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white px-4 py-3">
                <p className="font-display min-w-0 flex-1 text-sm font-bold text-foreground">
                  {leadsAssigned} of {coverage.length} branches have a lead
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/admin/leads"
                    className="font-display rounded-xl px-3.5 py-2 text-[10px] font-bold uppercase tracking-wide text-white"
                    style={{ background: "var(--staff-accent)" }}
                  >
                    Open Branch leads
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      void refreshCoverage(branches)
                    }
                    className="font-display inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-[10px] font-bold uppercase tracking-wide text-foreground hover:border-[var(--staff-accent)]"
                  >
                    <RefreshCw className="size-3.5" />
                    Refresh
                  </button>
                </div>
              </div>

              <ul className="mt-5 space-y-3">
                {coverage.map((row) => (
                  <li key={row.stationId} className="rounded-xl border border-border bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-display text-sm font-bold text-foreground">
                        {row.stationName}
                        <span className="font-mono ml-2 text-xs font-normal text-muted">
                          {row.stationCode} · {row.city}
                        </span>
                      </p>
                      {row.lead ? (
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
                            row.lead.credentialsSent
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              : "bg-amber-50 text-amber-800 ring-amber-200",
                          )}
                        >
                          {row.lead.credentialsSent ? "Login sent" : "Login not sent"}
                        </span>
                      ) : null}
                    </div>

                    {row.lead ? (
                      <>
                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                          <div>
                            <p className={labelClass}>Lead name</p>
                            <p className="font-body text-sm text-foreground">{row.lead.leadName}</p>
                          </div>
                          <div>
                            <p className={labelClass}>Phone</p>
                            <p className="font-body text-sm text-foreground">{row.lead.leadPhone}</p>
                          </div>
                          <div>
                            <p className={labelClass}>Email</p>
                            <p className="font-body text-sm text-foreground">
                              {row.lead.leadEmail.trim() || "—"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={() => sendLeadLogin(row)}
                            className="font-display inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-foreground hover:border-[var(--staff-accent)]"
                          >
                            <Send className="size-3.5" />
                            {row.lead.credentialsSent ? "Resend login" : "Send login"}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="font-body text-sm font-medium text-amber-700">
                          No lead account yet
                        </p>
                        <Link
                          href="/admin/leads"
                          className="font-display rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-amber-900"
                        >
                          Create lead
                        </Link>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {step === 3 && (
            <section>
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
                Review & activate
              </h2>
              <p className="font-body mt-1 text-sm text-muted">
                {isConfigured
                  ? `Review ${operator} branches and lead coverage, then save any updates.`
                  : `Confirm the ${operator} application setup — activation turns on HQ with ${operator} branding.`}
              </p>

              {missingLeads > 0 && (
                <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="font-body min-w-0 flex-1 text-sm text-amber-900">
                    {missingLeads}{" "}
                    {missingLeads === 1 ? "branch has" : "branches have"} no lead yet. You can
                    still activate and assign leads later.
                  </p>
                  <Link
                    href="/admin/leads"
                    className="font-display rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-[10px] font-bold uppercase tracking-wide text-amber-900"
                  >
                    Assign leads
                  </Link>
                </div>
              )}

              <div className="mt-5 flex items-center gap-4 rounded-xl border border-border bg-white p-4">
                <div className="rounded-xl border border-border bg-white p-2">
                  <OperatorLogo operator={operator} className="h-9" />
                </div>
                <div className="min-w-0">
                  <p className="font-display truncate text-sm font-bold text-foreground">
                    {companyName}
                  </p>
                  <p className="font-body text-xs text-muted">
                    {branches.length} {branches.length === 1 ? "branch" : "branches"} ·{" "}
                    {leadsAssigned} leads assigned
                  </p>
                </div>
                <span
                  className="ml-auto size-5 shrink-0 rounded-full ring-2 ring-inset ring-white"
                  style={{ background: OPERATOR_ACCENT[operator] }}
                  aria-label="Accent colour"
                />
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-border">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#0b1220] text-[11px] uppercase tracking-wider text-white">
                    <tr>
                      <th className="w-10 px-3 py-2.5 font-semibold">#</th>
                      <th className="px-3 py-2.5 font-semibold">Branch</th>
                      <th className="px-3 py-2.5 font-semibold">City</th>
                      <th className="px-3 py-2.5 font-semibold">Lead</th>
                      <th className="px-3 py-2.5 font-semibold">Phone</th>
                      <th className="px-3 py-2.5 font-semibold">Login</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coverage.map((row, index) => (
                      <tr key={row.stationId} className="border-t border-border">
                        <td className="px-3 py-2.5 font-medium text-muted">{index + 1}</td>
                        <td className="px-3 py-2.5">
                          <p className="font-medium text-foreground">{row.stationName}</p>
                          <p className="font-mono text-xs text-muted">{row.stationCode}</p>
                        </td>
                        <td className="px-3 py-2.5 text-muted">{row.city}</td>
                        <td className="px-3 py-2.5 text-muted">
                          {row.lead?.leadName ?? (
                            <span className="font-medium text-amber-700">No lead yet</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-muted">
                          {row.lead?.leadPhone ?? "—"}
                        </td>
                        <td className="px-3 py-2.5">
                          {row.lead ? (
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
                                row.lead.credentialsSent
                                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                  : "bg-amber-50 text-amber-800 ring-amber-200",
                              )}
                            >
                              {row.lead.credentialsSent ? "Sent" : "Not sent"}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          </div>

          <div className="flex shrink-0 items-center justify-between border-t border-border bg-surface px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="font-display flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-foreground transition-colors hover:border-[var(--staff-accent)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft className="size-4" />
              Back
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={goNext}
                className="font-display flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white"
                style={{ background: "var(--staff-accent)" }}
              >
                Continue
                <ArrowRight className="size-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={activate}
                disabled={activating}
                className="font-display flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white disabled:opacity-60"
                style={{ background: OPERATOR_ACCENT[operator] }}
              >
                <Rocket className="size-4" />
                {activating
                  ? isConfigured
                    ? "Saving…"
                    : "Activating…"
                  : isConfigured
                    ? "Save changes"
                    : "Activate application"}
              </button>
            )}
          </div>
        </div>

        <aside className="rounded-2xl border border-border bg-surface p-5 shadow-sm lg:sticky lg:top-4">
          <SetupPieChart {...getSetupPieBreakdown(step, branches, coverage)} />
        </aside>
        </div>
      </div>
    </main>
  );
}
