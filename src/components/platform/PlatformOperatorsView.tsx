"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  FileText,
  KeyRound,
  MapPin,
  PauseCircle,
  PlayCircle,
  Plus,
  X,
} from "lucide-react";
import { PlatformConfigurationLetterModal } from "@/components/platform/PlatformConfigurationLetterModal";
import { usePlatformData } from "@/components/platform/PlatformDataContext";
import { PlatformOperatorMark } from "@/components/platform/PlatformOperatorMark";
import {
  PlatformTablePagination,
  PlatformTableSnCell,
  PlatformTableSnHeader,
} from "@/components/platform/PlatformTablePagination";
import { PlatformTableToolbar } from "@/components/platform/PlatformTableToolbar";
import {
  formatPlatformWhen,
  operatorStatusLabel,
  type PlatformOperatorRow,
  type PlatformOperatorStatus,
} from "@/lib/platform-demo";
import { platformCredentialSuccessText, platformOnboardSmsText } from "@/lib/platform-credentials-message";
import { platformRowNumber, usePlatformPagination } from "@/lib/platform-pagination";
import { showConfirmDialog, showSuccessAlert, showValidationAlert } from "@/lib/sweetalert";
import { PLATFORM_THEME } from "@/lib/platform-theme";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | PlatformOperatorStatus;

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "configure", label: "Configure" },
  { id: "configured", label: "Configured" },
  { id: "suspended", label: "Suspended" },
  { id: "draft", label: "Draft" },
];

const ONBOARD_STEPS = [
  { id: 1, label: "Company" },
  { id: 2, label: "Branding" },
  { id: 3, label: "Network" },
  { id: 4, label: "HQ access" },
  { id: 5, label: "Review" },
] as const;

function operatorStatusTone(status: PlatformOperatorStatus) {
  if (status === "configured") return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  if (status === "configure") return "bg-amber-50 text-amber-900 ring-amber-200";
  if (status === "suspended") return "bg-red-50 text-red-800 ring-red-200";
  return "bg-stone-100 text-stone-700 ring-stone-200";
}

const inputClass =
  "font-body w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-[var(--platform-orange)] focus:ring-2 focus:ring-[var(--platform-orange-muted)]";

const labelClass =
  "font-display mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-stone-500";

function OnboardStepBar({ currentStep }: { currentStep: number }) {
  return (
    <div className="border-b border-stone-100 bg-white px-4 py-4 sm:px-5">
      <div className="flex items-start">
        {ONBOARD_STEPS.map((step, index) => {
          const done = currentStep > step.id;
          const active = currentStep === step.id;
          return (
            <div key={step.id} className="flex min-w-0 flex-1 items-start">
              <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all",
                    active &&
                      "bg-[var(--platform-orange)] text-white shadow-md ring-4 ring-[var(--platform-orange-muted)]",
                    done && "bg-emerald-600 text-white shadow-sm",
                    !active && !done && "border-2 border-stone-200 bg-stone-50 text-stone-400",
                  )}
                >
                  {done ? <Check className="size-4" strokeWidth={3} /> : step.id}
                </div>
                <span
                  className={cn(
                    "font-display w-full truncate px-0.5 text-center text-[9px] font-bold uppercase tracking-wide sm:text-[10px]",
                    active && "text-[var(--platform-orange-dark)]",
                    done && "text-emerald-800",
                    !active && !done && "text-stone-400",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < ONBOARD_STEPS.length - 1 ? (
                <div
                  className={cn(
                    "mt-4 h-0.5 min-w-2 flex-1 rounded-full",
                    done ? "bg-emerald-400" : "bg-stone-200",
                  )}
                  aria-hidden
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const BRAND_COLORS: { name: string; hex: string }[] = [
  { name: "Parcela Orange", hex: "#fd7e14" },
  { name: "Crimson Red", hex: "#dc2626" },
  { name: "Rose", hex: "#f43f5e" },
  { name: "Fuchsia", hex: "#d946ef" },
  { name: "Violet", hex: "#7c3aed" },
  { name: "Indigo", hex: "#4f46e5" },
  { name: "Royal Blue", hex: "#2563eb" },
  { name: "Sky Blue", hex: "#0ea5e9" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Teal", hex: "#0d9488" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Green", hex: "#22c55e" },
  { name: "Lime", hex: "#84cc16" },
  { name: "Yellow", hex: "#eab308" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Deep Orange", hex: "#ea580c" },
  { name: "Brown", hex: "#78350f" },
  { name: "Warm Slate", hex: "#64748b" },
  { name: "Stone Gray", hex: "#78716c" },
  { name: "Charcoal", hex: "#374151" },
  { name: "Navy", hex: "#1e3a5f" },
  { name: "Midnight", hex: "#1e1b4b" },
  { name: "Forest Green", hex: "#166534" },
  { name: "Olive", hex: "#4d7c0f" },
  { name: "Gold", hex: "#ca8a04" },
  { name: "Copper", hex: "#b45309" },
  { name: "Burgundy", hex: "#9f1239" },
  { name: "Maroon", hex: "#7f1d1d" },
  { name: "Plum", hex: "#6b21a8" },
  { name: "Cobalt", hex: "#1d4ed8" },
  { name: "Mint", hex: "#059669" },
  { name: "Turquoise", hex: "#0891b2" },
  { name: "Coral", hex: "#fb7185" },
  { name: "Salmon", hex: "#f97316" },
  { name: "Peach", hex: "#fed7aa" },
  { name: "Lavender", hex: "#a78bfa" },
  { name: "Dusty Rose", hex: "#e879f9" },
  { name: "Steel Blue", hex: "#3b82f6" },
  { name: "Graphite", hex: "#1c1917" },
  { name: "Silver", hex: "#9ca3af" },
];

type OnboardDraft = {
  name: string;
  code: string;
  region: string;
  contactEmail: string;
  contactPhone: string;
  agreementDate: string;
  brandColor: string;
  cityCount: string;
  stationCount: string;
  notes: string;
  hqName: string;
  hqEmail: string;
  hqPhone: string;
  issueLoginsNow: boolean;
};

const EMPTY_DRAFT: OnboardDraft = {
  name: "",
  code: "",
  region: "Ghana",
  contactEmail: "",
  contactPhone: "",
  agreementDate: "",
  brandColor: "#fd7e14",
  cityCount: "",
  stationCount: "",
  notes: "",
  hqName: "",
  hqEmail: "",
  hqPhone: "",
  issueLoginsNow: true,
};

export function PlatformOperatorsView() {
  const {
    operators,
    hqAdmins,
    stats,
    createOperator,
    markConfigured,
    toggleSuspend,
    patchOperatorLocal,
    recordConfigurationLetter,
    issueHqCredentials,
  } = usePlatformData();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [onboardStep, setOnboardStep] = useState(1);
  const [draft, setDraft] = useState<OnboardDraft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [colorDropOpen, setColorDropOpen] = useState(false);
  const colorDropRef = useRef<HTMLDivElement>(null);
  const [letterOperatorId, setLetterOperatorId] = useState<string | null>(null);
  const [letterAgreementDate, setLetterAgreementDate] = useState("");

  useEffect(() => {
    if (!selectedId && operators[0]?.id) setSelectedId(operators[0].id);
  }, [operators, selectedId]);

  const statsCards = {
    operatorsConfigured: stats.operatorsConfigured,
    operatorsConfigure: stats.operatorsConfigure,
    operatorsTotal: stats.operatorsTotal,
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return operators.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        row.code.toLowerCase().includes(q) ||
        row.region.toLowerCase().includes(q) ||
        (row.primaryAdminEmail?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [operators, query, statusFilter]);

  const listPagination = usePlatformPagination(filtered, 8, `${query}|${statusFilter}`);

  const selected =
    filtered.find((o) => o.id === selectedId) ??
    operators.find((o) => o.id === selectedId) ??
    filtered[0] ??
    null;

  const selectedHq = selected
    ? hqAdmins.filter((person) => person.operatorCode === selected.code)
    : [];

  const letterOperator =
    operators.find((row) => row.id === letterOperatorId) ?? null;

  function openConfigurationLetter(row: PlatformOperatorRow) {
    setLetterOperatorId(row.id);
    setLetterAgreementDate(row.agreementDate ?? "");
  }

  function closeConfigurationLetter() {
    setLetterOperatorId(null);
    setLetterAgreementDate("");
  }

  function updateLetterAgreementDate(value: string) {
    setLetterAgreementDate(value);
    if (!letterOperatorId) return;
    patchOperatorLocal(letterOperatorId, { agreementDate: value || null });
  }

  function openOnboard() {
    setDraft(EMPTY_DRAFT);
    setOnboardStep(1);
    setOnboardOpen(true);
  }

  function closeOnboard() {
    setOnboardOpen(false);
    setOnboardStep(1);
    setDraft(EMPTY_DRAFT);
  }

  async function validateStep(step: number): Promise<boolean> {
    if (step === 1) {
      if (!draft.name.trim() || !draft.code.trim()) {
        await showValidationAlert({
          title: "Company details required",
          text: "Enter the transport company name and a short code (e.g. VIP, OA, METRO).",
        });
        return false;
      }
      if (!draft.agreementDate.trim()) {
        await showValidationAlert({
          title: "Agreement date required",
          text: "Enter the date the platform agreement was signed before onboarding.",
        });
        return false;
      }
      const code = draft.code.trim().toUpperCase();
      if (operators.some((o) => o.code.toUpperCase() === code)) {
        await showValidationAlert({
          title: "Code already used",
          text: `${code} is already on the platform. Choose another code.`,
        });
        return false;
      }
    }
    if (step === 3) {
      const stations = Number(draft.stationCount);
      if (!draft.stationCount.trim() || Number.isNaN(stations) || stations < 1) {
        await showValidationAlert({
          title: "Network size required",
          text: "Enter how many stations / terminals this transport will run.",
        });
        return false;
      }
    }
    if (step === 4) {
      if (!draft.hqName.trim() || !draft.hqEmail.trim()) {
        await showValidationAlert({
          title: "HQ admin required",
          text: "Add the HQ admin name and email. You will hand them login after configuration.",
        });
        return false;
      }
    }
    return true;
  }

  async function goNext() {
    const ok = await validateStep(onboardStep);
    if (!ok) return;
    setOnboardStep((s) => Math.min(5, s + 1));
  }

  async function handleMarkConfigured(row: PlatformOperatorRow) {
    if (row.status === "configured") return;
    const confirmed = await showConfirmDialog({
      title: `Mark ${row.code} as configured?`,
      text: "Do this after the transport service is fully set up. You can then hand HQ logins to their team. Branch leads are created later by HQ — or they can contact you if needed.",
      confirmText: "Mark configured",
      cancelText: "Not yet",
      confirmButtonColor: "#fd7e14",
    });
    if (!confirmed) return;
    const updated = await markConfigured(row.id);
    openConfigurationLetter(updated);
  }

  async function handleIssueHqLogins(row: PlatformOperatorRow) {
    if (!row.primaryAdminEmail) {
      await showValidationAlert({
        title: "No HQ admin",
        text: "Add an HQ admin before issuing logins.",
      });
      return;
    }
    const hqAdmin = hqAdmins.find(
      (admin) =>
        admin.email.toLowerCase() === row.primaryAdminEmail?.toLowerCase() &&
        admin.operatorCode.toUpperCase() === row.code.toUpperCase(),
    );
    if (!hqAdmin) {
      await showValidationAlert({
        title: "HQ admin not found",
        text: "Link an HQ admin for this operator before issuing logins.",
      });
      return;
    }
    const confirmed = await showConfirmDialog({
      title: "Issue HQ logins?",
      text: `Send temporary credentials by SMS to ${hqAdmin.displayName} (${hqAdmin.email}). They sign in at /admin and finish their network setup.`,
      confirmText: "Issue logins",
      cancelText: "Cancel",
      confirmButtonColor: "#fd7e14",
    });
    if (!confirmed) return;

    const result = await issueHqCredentials(hqAdmin.id);
    await showSuccessAlert({
      title: result.smsSent ? "HQ login sent" : "HQ login ready",
      text: platformCredentialSuccessText(result),
      confirmButtonColor: "#fd7e14",
    });
  }

  async function handleToggleSuspend(row: PlatformOperatorRow) {
    const suspending = row.status !== "suspended";
    const confirmed = await showConfirmDialog({
      title: suspending ? `Suspend ${row.code}?` : `Resume ${row.code}?`,
      text: suspending
        ? "Use when a transport should not operate on Parcela until you reopen them."
        : "Return this transport to configure or configured.",
      confirmText: suspending ? "Suspend" : "Resume",
      cancelText: "Cancel",
      icon: suspending ? "warning" : "question",
      confirmButtonColor: suspending ? "#dc2626" : "#fd7e14",
    });
    if (!confirmed) return;
    await toggleSuspend(row.id);
    await showSuccessAlert({
      title: suspending ? "Suspended" : "Resumed",
      text: suspending
        ? `${row.name} is suspended in this UI preview.`
        : `${row.name} is active again.`,
      confirmButtonColor: "#fd7e14",
    });
  }

  async function submitOnboard() {
    const ok = await validateStep(4);
    if (!ok) return;

    setSaving(true);
    try {
      const next = await createOperator({
        name: draft.name.trim(),
        code: draft.code.trim(),
        region: draft.region.trim() || "Ghana",
        contactEmail: draft.contactEmail.trim() || undefined,
        contactPhone: draft.contactPhone.trim() || undefined,
        brandColor: draft.brandColor || "#fd7e14",
        cityCount: Math.max(1, Number(draft.cityCount) || 1),
        stationCount: Math.max(1, Number(draft.stationCount) || 1),
        notes: draft.notes.trim() || undefined,
        agreementDate: draft.agreementDate,
        hqName: draft.hqName.trim(),
        hqEmail: draft.hqEmail.trim().toLowerCase(),
        hqPhone: draft.hqPhone.trim() || undefined,
        issueLoginsNow: draft.issueLoginsNow,
      });
      setSelectedId(next.id);
      closeOnboard();
      await showSuccessAlert({
        title: "Transport onboarded",
        text: `${next.name} is on Parcela with status Configure. ${platformOnboardSmsText(
          draft.issueLoginsNow,
          next.hqSmsSent,
          next.primaryAdminEmail ?? draft.hqEmail,
        )}`,
        confirmButtonColor: "#fd7e14",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-stone-400">
            Platform
          </p>
          <h1 className="font-display mt-1 text-2xl font-bold text-stone-900">Operators</h1>
          <p className="font-body mt-1 max-w-2xl text-sm text-stone-500">
            Onboard any transport service — company details, branding, network size, and HQ access.
            After configuration you hand them HQ logins. Branch leads are created by their HQ (or
            they contact you).
          </p>
        </div>
        <button
          type="button"
          onClick={openOnboard}
          className="font-display inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm"
          style={{ background: "var(--platform-orange)" }}
        >
          <Plus className="size-3.5" />
          Onboard transport
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Configured", value: statsCards.operatorsConfigured },
          { label: "Configure", value: statsCards.operatorsConfigure },
          { label: "Total transports", value: statsCards.operatorsTotal },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-stone-200 bg-white px-4 py-4 shadow-sm"
          >
            <p className="font-display text-[10px] font-bold uppercase tracking-wide text-stone-500">
              {card.label}
            </p>
            <p className="font-display mt-1 text-2xl font-bold text-stone-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setStatusFilter(filter.id)}
              className={cn(
                "font-display rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors",
                statusFilter === filter.id
                  ? "bg-[var(--platform-orange)] text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <PlatformTableToolbar
            value={query}
            onChange={setQuery}
            placeholder="Search transport, code, region, or HQ email…"
            resultCount={filtered.length}
            totalCount={operators.length}
          />
          <div className="overflow-x-auto">
            <table className="min-w-[700px] w-full text-left">
              <thead>
                <tr className="bg-[var(--platform-orange)] text-[10px] uppercase tracking-wider text-white">
                  <PlatformTableSnHeader />
                  <th className="font-display px-4 py-3 font-bold">Transport</th>
                  <th className="font-display px-4 py-3 font-bold">Status</th>
                  <th className="font-display px-4 py-3 font-bold">Region</th>
                  <th className="font-display px-4 py-3 font-bold">Stations</th>
                  <th className="font-display px-4 py-3 font-bold">HQ</th>
                  <th className="font-display px-4 py-3 font-bold">Updated</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center">
                      <p className="font-body text-sm text-stone-500">No transports match this filter.</p>
                    </td>
                  </tr>
                ) : (
                  listPagination.pageItems.map((row, index) => {
                    const active = selected?.id === row.id;
                    return (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedId(row.id)}
                        className={cn(
                          "cursor-pointer border-t border-stone-100 transition-colors",
                          active ? "bg-[var(--platform-orange-soft)]" : "hover:bg-stone-50",
                        )}
                      >
                        <PlatformTableSnCell
                          value={platformRowNumber(
                            listPagination.currentPage,
                            listPagination.pageSize,
                            index,
                          )}
                        />
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <PlatformOperatorMark
                              code={row.code}
                              name={row.name}
                              brandColor={row.brandColor}
                            />
                            <div>
                              <p className="font-display text-sm font-bold text-stone-900">
                                {row.name}
                              </p>
                              <p className="font-mono text-[11px] text-stone-500">{row.code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              "font-display inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
                              operatorStatusTone(row.status),
                            )}
                          >
                            {operatorStatusLabel(row.status)}
                          </span>
                        </td>
                        <td className="font-body px-4 py-3.5 text-sm text-stone-700">{row.region}</td>
                        <td className="font-body px-4 py-3.5 text-sm text-stone-700">
                          {row.stationCount}
                        </td>
                        <td className="font-body px-4 py-3.5 text-sm text-stone-700">
                          {row.hqAdminCount}
                        </td>
                        <td className="font-body px-4 py-3.5 text-xs text-stone-500">
                          {formatPlatformWhen(row.updatedAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <PlatformTablePagination
            currentPage={listPagination.currentPage}
            totalPages={listPagination.totalPages}
            pageStart={listPagination.pageStart}
            pageEnd={listPagination.pageEnd}
            totalItems={listPagination.totalItems}
            onPageChange={listPagination.setPage}
          />
        </section>

        <aside className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          {!selected ? (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
              <Building2 className="size-8 text-stone-300" />
              <p className="font-display mt-3 text-sm font-bold text-stone-700">Select a transport</p>
              <p className="font-body mt-1 text-xs text-stone-500">
                Configuration and HQ handover actions appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <PlatformOperatorMark
                    code={selected.code}
                    name={selected.name}
                    brandColor={selected.brandColor}
                    size="md"
                  />
                  <div>
                    <h2 className="font-display text-lg font-bold text-stone-900">{selected.name}</h2>
                    <p className="font-mono text-xs text-stone-500">{selected.code}</p>
                  </div>
                </div>
                <span
                  className={cn(
                    "font-display rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
                    operatorStatusTone(selected.status),
                  )}
                >
                  {operatorStatusLabel(selected.status)}
                </span>
              </div>

              <p className="font-body mt-4 text-sm leading-relaxed text-stone-600">
                {selected.notes ||
                  "Configure this transport fully, then issue HQ logins. Branch leads are managed by HQ."}
              </p>

              <dl className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-stone-50 px-3 py-3">
                  <dt className="font-display text-[10px] font-bold uppercase tracking-wide text-stone-500">
                    Stations
                  </dt>
                  <dd className="font-display mt-1 text-xl font-bold text-stone-900">
                    {selected.stationCount}
                  </dd>
                </div>
                <div className="rounded-xl bg-stone-50 px-3 py-3">
                  <dt className="font-display text-[10px] font-bold uppercase tracking-wide text-stone-500">
                    Cities
                  </dt>
                  <dd className="font-display mt-1 text-xl font-bold text-stone-900">
                    {selected.cityCount}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 space-y-2 rounded-xl border border-stone-200 px-3.5 py-3">
                <div className="flex items-center gap-2 text-stone-500">
                  <MapPin className="size-3.5" />
                  <p className="font-body text-xs">{selected.region}</p>
                </div>
                <p className="font-body text-xs text-stone-500">
                  Contact: {selected.contactEmail ?? "—"}
                  {selected.contactPhone ? ` · ${selected.contactPhone}` : ""}
                </p>
              </div>

              <div className="mt-5 rounded-xl border border-stone-200 px-3.5 py-3">
                <p className="font-display text-[10px] font-bold uppercase tracking-wide text-stone-500">
                  Primary HQ (you hand logins to them)
                </p>
                <p className="font-display mt-1 text-sm font-semibold text-stone-900">
                  {selected.primaryAdminName ?? "Not assigned"}
                </p>
                <p className="font-mono text-[11px] text-stone-500">
                  {selected.primaryAdminEmail ?? "—"}
                </p>
              </div>

              <div className="mt-5">
                <p className="font-display text-[10px] font-bold uppercase tracking-wide text-stone-500">
                  HQ accounts
                </p>
                {selectedHq.length === 0 ? (
                  <p className="mt-2 rounded-xl border border-dashed border-stone-200 px-3 py-3 text-xs text-stone-500">
                    No HQ admins linked yet — add during onboard or from HQ admins.
                  </p>
                ) : (
                  <div className="mt-2 overflow-hidden rounded-xl border border-stone-200">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-[var(--platform-orange)] text-[10px] uppercase tracking-wider text-white">
                          <PlatformTableSnHeader />
                          <th className="font-display px-3 py-2 font-bold">Name</th>
                          <th className="font-display px-3 py-2 font-bold">Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedHq.map((person, index) => (
                          <tr key={person.id} className="border-t border-stone-100">
                            <PlatformTableSnCell value={index + 1} />
                            <td className="font-display truncate px-3 py-2 text-sm font-semibold text-stone-900">
                              {person.displayName}
                            </td>
                            <td className="font-mono truncate px-3 py-2 text-[10px] text-stone-500">
                              {person.email}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="font-body mt-3 text-[11px] leading-relaxed text-stone-500">
                  Branch leads: created by this transport’s HQ after they are configured. If they
                  need Parcela to create a lead, they contact you.
                </p>
              </div>

              <div className="mt-6 grid gap-2">
                {selected.status !== "configured" && selected.status !== "suspended" ? (
                  <button
                    type="button"
                    onClick={() => void handleMarkConfigured(selected)}
                    className="font-display inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white"
                    style={{ background: "var(--platform-orange)" }}
                  >
                    <CheckCircle2 className="size-3.5" />
                    Mark configured
                  </button>
                ) : null}
                {selected.status === "configured" ? (
                  <button
                    type="button"
                    onClick={() => openConfigurationLetter(selected)}
                    className="font-display inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-stone-800 hover:bg-stone-50"
                  >
                    <FileText className="size-3.5" />
                    Configuration letter
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => void handleIssueHqLogins(selected)}
                  className="font-display inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-stone-800 hover:bg-stone-50"
                >
                  <KeyRound className="size-3.5" />
                  Issue HQ logins
                </button>
                <button
                  type="button"
                  onClick={() => void handleToggleSuspend(selected)}
                  className="font-display inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-stone-800 hover:bg-stone-50"
                >
                  {selected.status === "suspended" ? (
                    <>
                      <PlayCircle className="size-3.5" />
                      Resume transport
                    </>
                  ) : (
                    <>
                      <PauseCircle className="size-3.5" />
                      Suspend transport
                    </>
                  )}
                </button>
                <Link
                  href="/platform/hq-admins"
                  className="font-display inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-stone-800 hover:bg-stone-50"
                >
                  Manage HQ admins
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </>
          )}
        </aside>
      </div>

      {onboardOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-sm">
          <div
            className="platform-portal flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl"
            style={
              {
                "--platform-orange": PLATFORM_THEME.orange,
                "--platform-orange-dark": PLATFORM_THEME.orangeDark,
                "--platform-orange-muted": PLATFORM_THEME.orangeMuted,
                "--platform-orange-soft": PLATFORM_THEME.orangeSoft,
              } as React.CSSProperties
            }
          >
            <div
              className="relative overflow-hidden px-5 py-5 text-white"
              style={{ background: PLATFORM_THEME.headerGradient }}
            >
              <div
                className="pointer-events-none absolute -right-6 -top-8 size-32 rounded-full bg-white/10 blur-2xl"
                aria-hidden
              />
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm">
                    <Building2 className="size-5" strokeWidth={2.25} />
                  </div>
                  <div>
                    <p className="font-display text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
                      Step {onboardStep} of {ONBOARD_STEPS.length}
                    </p>
                    <h2 className="font-display mt-0.5 text-lg font-bold tracking-tight sm:text-xl">
                      Onboard transport service
                    </h2>
                    <p className="font-body mt-1 text-sm text-white/85">
                      {ONBOARD_STEPS.find((s) => s.id === onboardStep)?.label} — fill in the details below
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeOnboard}
                  className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Close"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <OnboardStepBar currentStep={onboardStep} />

            <div className="min-h-0 flex-1 overflow-y-auto bg-stone-50/70 px-4 py-4 sm:px-5 sm:py-5">
              <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
              {onboardStep === 1 && (
                <div className="space-y-5">
                  <div className="rounded-xl border border-[var(--platform-orange-muted)] bg-[var(--platform-orange-soft)] px-4 py-3">
                    <p className="font-body text-sm leading-relaxed text-stone-700">
                      Any transport company — not limited to VIP or STC. Capture who they are first.
                    </p>
                  </div>
                  <div>
                    <label htmlFor="op-name" className={labelClass}>
                      Company / transport name
                    </label>
                    <input
                      id="op-name"
                      className={inputClass}
                      value={draft.name}
                      onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                      placeholder="e.g. OA Travel & Tour, Metro Mass, VIP Transport"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="op-code" className={labelClass}>
                        Short code
                      </label>
                      <input
                        id="op-code"
                        className={cn(inputClass, "font-mono uppercase")}
                        value={draft.code}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, code: e.target.value.toUpperCase() }))
                        }
                        placeholder="VIP / STC / OA / MM"
                        maxLength={8}
                      />
                    </div>
                    <div>
                      <label htmlFor="op-region" className={labelClass}>
                        Operating region
                      </label>
                      <input
                        id="op-region"
                        className={inputClass}
                        value={draft.region}
                        onChange={(e) => setDraft((d) => ({ ...d, region: e.target.value }))}
                        placeholder="Nationwide, Ashanti, Greater Accra…"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="op-email" className={labelClass}>
                        Company email
                      </label>
                      <input
                        id="op-email"
                        type="email"
                        className={inputClass}
                        value={draft.contactEmail}
                        onChange={(e) => setDraft((d) => ({ ...d, contactEmail: e.target.value }))}
                        placeholder="ops@company.com"
                      />
                    </div>
                    <div>
                      <label htmlFor="op-phone" className={labelClass}>
                        Company phone
                      </label>
                      <input
                        id="op-phone"
                        className={inputClass}
                        value={draft.contactPhone}
                        onChange={(e) => setDraft((d) => ({ ...d, contactPhone: e.target.value }))}
                        placeholder="0302…"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="op-agreement-date" className={labelClass}>
                      Agreement signed on
                    </label>
                    <input
                      id="op-agreement-date"
                      type="date"
                      className={inputClass}
                      value={draft.agreementDate}
                      onChange={(e) => setDraft((d) => ({ ...d, agreementDate: e.target.value }))}
                    />
                    <p className="font-body mt-1.5 text-[11px] text-stone-500">
                      Commercial terms are agreed before onboarding. A configuration letter is auto-generated
                      when setup is complete.
                    </p>
                  </div>
                </div>
              )}

              {onboardStep === 2 && (
                <div className="space-y-5">
                  <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
                    <p className="font-body text-sm leading-relaxed text-stone-600">
                      Brand colour for their HQ portal later. Logo upload can be added when we wire
                      storage.
                    </p>
                  </div>

                  {/* Preview + colour picker row */}
                  <div className="flex flex-wrap items-start gap-5">
                    {/* Live preview mark */}
                    <div className="flex flex-col items-center gap-2">
                      <PlatformOperatorMark
                        code={draft.code || "NEW"}
                        name={draft.name || "New transport"}
                        brandColor={draft.brandColor}
                        size="lg"
                      />
                      <span
                        className="font-mono rounded-lg px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm"
                        style={{ background: draft.brandColor }}
                      >
                        {draft.brandColor}
                      </span>
                    </div>

                    {/* Colour selector */}
                    <div className="min-w-[220px] flex-1 space-y-2">
                      <label htmlFor="op-color-drop" className={labelClass}>
                        Brand colour
                      </label>

                      {/* Custom dropdown */}
                      <div ref={colorDropRef} className="relative">
                        <button
                          id="op-color-drop"
                          type="button"
                          onClick={() => setColorDropOpen((o) => !o)}
                          className="font-body flex w-full items-center gap-3 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-sm transition-colors hover:border-stone-300 focus:border-[var(--platform-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--platform-orange-muted)]"
                        >
                          <span
                            className="inline-block size-5 flex-shrink-0 rounded-md shadow-sm ring-1 ring-black/10"
                            style={{ background: draft.brandColor }}
                          />
                          <span className="flex-1 text-left">
                            {BRAND_COLORS.find((c) => c.hex.toLowerCase() === draft.brandColor.toLowerCase())?.name ?? "Custom colour"}
                          </span>
                          <span className="font-mono text-[11px] text-stone-400">{draft.brandColor}</span>
                          <svg
                            className={cn("size-4 text-stone-400 transition-transform", colorDropOpen && "rotate-180")}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {colorDropOpen && (
                          <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 max-h-64 overflow-y-auto rounded-xl border border-stone-200 bg-white shadow-xl">
                            <div className="p-1">
                              {BRAND_COLORS.map((color) => {
                                const isSelected = draft.brandColor.toLowerCase() === color.hex.toLowerCase();
                                return (
                                  <button
                                    key={color.hex}
                                    type="button"
                                    onClick={() => {
                                      setDraft((d) => ({ ...d, brandColor: color.hex }));
                                      setColorDropOpen(false);
                                    }}
                                    className={cn(
                                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                                      isSelected
                                        ? "bg-[var(--platform-orange-soft)] text-stone-900"
                                        : "text-stone-700 hover:bg-stone-50",
                                    )}
                                  >
                                    <span
                                      className="inline-block size-5 flex-shrink-0 rounded-md shadow-sm ring-1 ring-black/10"
                                      style={{ background: color.hex }}
                                    />
                                    <span className="flex-1 text-left font-medium">{color.name}</span>
                                    <span className="font-mono text-[11px] text-stone-400">{color.hex}</span>
                                    {isSelected && (
                                      <svg className="size-4 text-[var(--platform-orange)]" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Manual hex input */}
                      <div className="flex items-center gap-2">
                        <input
                          id="op-color"
                          type="color"
                          value={draft.brandColor}
                          onChange={(e) => {
                            setDraft((d) => ({ ...d, brandColor: e.target.value }));
                            setColorDropOpen(false);
                          }}
                          className="h-9 w-12 cursor-pointer rounded-lg border border-stone-200 bg-white p-1"
                          title="Pick a custom colour"
                        />
                        <input
                          className={cn(inputClass, "font-mono")}
                          value={draft.brandColor}
                          onChange={(e) => setDraft((d) => ({ ...d, brandColor: e.target.value }))}
                          placeholder="#fd7e14"
                        />
                      </div>
                      <p className="font-body text-[11px] text-stone-400">
                        Pick from the list above or type / eyedrop a custom hex.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center">
                    <p className="font-display text-sm font-semibold text-stone-700">Logo upload</p>
                    <p className="font-body mt-1 text-xs text-stone-500">
                      Coming with file storage. For now the colour + initials mark the brand.
                    </p>
                  </div>
                </div>
              )}

              {onboardStep === 3 && (
                <div className="space-y-5">
                  <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
                    <p className="font-body text-sm leading-relaxed text-stone-600">
                      How big is this network? You (or they) will refine stations after HQ is live.
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="op-cities" className={labelClass}>
                        Cities / corridors
                      </label>
                      <input
                        id="op-cities"
                        type="number"
                        min={1}
                        className={inputClass}
                        value={draft.cityCount}
                        onChange={(e) => setDraft((d) => ({ ...d, cityCount: e.target.value }))}
                        placeholder="e.g. 6"
                      />
                    </div>
                    <div>
                      <label htmlFor="op-stations" className={labelClass}>
                        Stations / terminals
                      </label>
                      <input
                        id="op-stations"
                        type="number"
                        min={1}
                        className={inputClass}
                        value={draft.stationCount}
                        onChange={(e) => setDraft((d) => ({ ...d, stationCount: e.target.value }))}
                        placeholder="e.g. 12"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="op-notes" className={labelClass}>
                      Setup notes
                    </label>
                    <textarea
                      id="op-notes"
                      rows={3}
                      className={inputClass}
                      value={draft.notes}
                      onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                      placeholder="Routes, special rules, go-live date, what still needs configuring…"
                    />
                  </div>
                </div>
              )}

              {onboardStep === 4 && (
                <div className="space-y-5">
                  <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
                    <p className="font-body text-sm leading-relaxed text-stone-600">
                      Create the HQ person who will run this transport on Parcela. After you mark the
                      operator <span className="font-semibold">Configured</span>, you give them HQ
                      logins. They create branch leads — or contact you if they need help.
                    </p>
                  </div>
                  <div>
                    <label htmlFor="hq-name" className={labelClass}>
                      HQ admin full name
                    </label>
                    <input
                      id="hq-name"
                      className={inputClass}
                      value={draft.hqName}
                      onChange={(e) => setDraft((d) => ({ ...d, hqName: e.target.value }))}
                      placeholder="Ama Mensah"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="hq-email" className={labelClass}>
                        HQ work email
                      </label>
                      <input
                        id="hq-email"
                        type="email"
                        className={inputClass}
                        value={draft.hqEmail}
                        onChange={(e) => setDraft((d) => ({ ...d, hqEmail: e.target.value }))}
                        placeholder="hq@company.com"
                      />
                    </div>
                    <div>
                      <label htmlFor="hq-phone" className={labelClass}>
                        HQ phone
                      </label>
                      <input
                        id="hq-phone"
                        className={inputClass}
                        value={draft.hqPhone}
                        onChange={(e) => setDraft((d) => ({ ...d, hqPhone: e.target.value }))}
                        placeholder="0244…"
                      />
                    </div>
                  </div>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-3">
                    <input
                      type="checkbox"
                      checked={draft.issueLoginsNow}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, issueLoginsNow: e.target.checked }))
                      }
                      className="mt-1 size-4 rounded border-stone-300 text-[var(--platform-orange)] focus:ring-[var(--platform-orange)]"
                    />
                    <span>
                      <span className="font-display text-sm font-semibold text-stone-900">
                        Prepare HQ logins after create
                      </span>
                      <span className="font-body mt-0.5 block text-xs text-stone-500">
                        You still mark the transport Configured when setup is done, then hand over
                        credentials.
                      </span>
                    </span>
                  </label>
                </div>
              )}

              {onboardStep === 5 && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                    <div className="flex items-center gap-3">
                      <PlatformOperatorMark
                        code={draft.code || "NEW"}
                        name={draft.name}
                        brandColor={draft.brandColor}
                        size="md"
                      />
                      <div>
                        <p className="font-display font-bold text-stone-900">
                          {draft.name || "Transport"}
                        </p>
                        <p className="font-mono text-xs text-stone-500">
                          {(draft.code || "—").toUpperCase()} · {draft.region || "—"}
                        </p>
                      </div>
                    </div>
                    <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="font-display text-[10px] font-bold uppercase text-stone-400">
                          Network
                        </dt>
                        <dd className="font-body text-stone-800">
                          {draft.stationCount || "—"} stations · {draft.cityCount || "—"} cities
                        </dd>
                      </div>
                      <div>
                        <dt className="font-display text-[10px] font-bold uppercase text-stone-400">
                          Company contact
                        </dt>
                        <dd className="font-body text-stone-800">
                          {draft.contactEmail || "—"}
                          {draft.contactPhone ? ` · ${draft.contactPhone}` : ""}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-display text-[10px] font-bold uppercase text-stone-400">
                          Agreement signed
                        </dt>
                        <dd className="font-body text-stone-800">
                          {draft.agreementDate || "—"}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="font-display text-[10px] font-bold uppercase text-stone-400">
                          HQ admin
                        </dt>
                        <dd className="font-body text-stone-800">
                          {draft.hqName || "—"} · {draft.hqEmail || "—"}
                        </dd>
                      </div>
                    </dl>
                    {draft.notes ? (
                      <p className="font-body mt-3 border-t border-stone-200 pt-3 text-xs text-stone-600">
                        {draft.notes}
                      </p>
                    ) : null}
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
                    <p className="font-display text-xs font-bold uppercase tracking-wide">
                      After create
                    </p>
                    <p className="font-body mt-1 text-sm leading-relaxed">
                      Status starts as <strong>Configure</strong>. Finish service setup →{" "}
                      <strong>Mark configured</strong> → <strong>Issue HQ logins</strong>. Their HQ
                      then creates branch leads (or contacts you).
                    </p>
                  </div>
                </div>
              )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-stone-100 bg-white px-4 py-4 sm:px-5">
              <button
                type="button"
                onClick={() => {
                  if (onboardStep === 1) closeOnboard();
                  else setOnboardStep((s) => s - 1);
                }}
                className="font-display rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-stone-700 transition-colors hover:bg-stone-50"
              >
                {onboardStep === 1 ? "Cancel" : "Back"}
              </button>
              {onboardStep < 5 ? (
                <button
                  type="button"
                  onClick={() => void goNext()}
                  className="font-display inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-md transition-opacity hover:opacity-95"
                  style={{ background: "var(--platform-orange)" }}
                >
                  Continue
                  <ArrowRight className="size-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void submitOnboard()}
                  className="font-display inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-md transition-opacity hover:opacity-95 disabled:opacity-60"
                  style={{ background: "var(--platform-orange)" }}
                >
                  {saving ? "Creating…" : "Create transport"}
                  {!saving ? <Check className="size-3.5" /> : null}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {letterOperator ? (
        <PlatformConfigurationLetterModal
          operator={letterOperator}
          agreementDate={letterAgreementDate}
          onAgreementDateChange={updateLetterAgreementDate}
          onClose={closeConfigurationLetter}
          onEmailed={() => {
            if (!letterOperatorId) return;
            void recordConfigurationLetter(letterOperatorId, letterAgreementDate || undefined);
          }}
        />
      ) : null}
    </main>
  );
}
