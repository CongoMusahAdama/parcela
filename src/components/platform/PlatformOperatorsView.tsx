"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Edit2,
  FileText,
  KeyRound,
  Loader2,
  MapPin,
  PauseCircle,
  PlayCircle,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { PlatformConfigurationLetterModal } from "@/components/platform/PlatformConfigurationLetterModal";
import { PlatformEditOperatorModal } from "@/components/platform/PlatformEditOperatorModal";
import { GhanaCitySelect } from "@/components/platform/GhanaCitySelect";
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
import { readOperatorLogoFile } from "@/lib/operator-logo-upload";
import { PLATFORM_BRAND_COLORS } from "@/lib/platform-brand-colors";
import { isValidEmail } from "@/lib/email-validation";
import {
  computeSubscriptionExpiresAt,
  defaultLicenceDuration,
  formatLicenceExpiryLabel,
  licenceDurationOptions,
  type SubscriptionPlan,
} from "@/lib/subscription-term";
import { ApiError } from "@/lib/api-client";
import { resolveGhanaCityName } from "@/lib/ghana-cities";
import {
  parseBulkTerminalLines,
  parseTerminalNamesForCity,
} from "@/lib/onboard-terminals";
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

const BRAND_COLORS = PLATFORM_BRAND_COLORS;

type OnboardTerminal = {
  id: string;
  name: string;
  city: string;
};

type OnboardDraft = {
  name: string;
  code: string;
  region: string;
  contactEmail: string;
  contactPhone: string;
  agreementDate: string;
  brandColor: string;
  logoDataUrl: string | null;
  logoFileName: string;
  cityCount: string;
  stationCount: string;
  terminals: OnboardTerminal[];
  notes: string;
  hqName: string;
  hqEmail: string;
  hqPhone: string;
  issueLoginsNow: boolean;
  subscriptionPlan: SubscriptionPlan;
  subscriptionDuration: string;
  subscriptionPaidAt: string;
  subscriptionAmountGhs: string;
};

const EMPTY_DRAFT: OnboardDraft = {
  name: "",
  code: "",
  region: "Ghana",
  contactEmail: "",
  contactPhone: "",
  agreementDate: "",
  brandColor: "#fd7e14",
  logoDataUrl: null,
  logoFileName: "",
  cityCount: "",
  stationCount: "",
  terminals: [],
  notes: "",
  hqName: "",
  hqEmail: "",
  hqPhone: "",
  issueLoginsNow: true,
  subscriptionPlan: "annual",
  subscriptionDuration: "12",
  subscriptionPaidAt: "",
  subscriptionAmountGhs: "",
};

export function PlatformOperatorsView() {
  const {
    operators,
    hqAdmins,
    stats,
    createOperator,
    markConfigured,
    toggleSuspend,
    deleteOperator,
    fetchOperatorTerminals,
    addOperatorTerminals,
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
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [terminalDraft, setTerminalDraft] = useState({ name: "", city: "" });
  const [networkInputMode, setNetworkInputMode] = useState<"quick" | "list">("quick");
  const [bulkPasteText, setBulkPasteText] = useState("");
  const [cityBatchText, setCityBatchText] = useState("");
  const [letterOperatorId, setLetterOperatorId] = useState<string | null>(null);
  const [editOperatorId, setEditOperatorId] = useState<string | null>(null);
  const [letterAgreementDate, setLetterAgreementDate] = useState("");
  const [suspendBusyId, setSuspendBusyId] = useState<string | null>(null);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);
  const [terminalsModalOperatorId, setTerminalsModalOperatorId] = useState<string | null>(null);
  const [existingTerminals, setExistingTerminals] = useState<
    Array<{ id: string; name: string; city: string; code: string }>
  >([]);
  const [pendingTerminals, setPendingTerminals] = useState<OnboardTerminal[]>([]);
  const [manageTerminalDraft, setManageTerminalDraft] = useState({ name: "", city: "" });
  const [terminalsLoading, setTerminalsLoading] = useState(false);
  const [terminalsSaving, setTerminalsSaving] = useState(false);

  const isProtectedOperator = (code: string) => code === "VIP" || code === "STC";

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

  const editOperator =
    operators.find((row) => row.id === editOperatorId) ?? null;

  const terminalsModalOperator =
    operators.find((row) => row.id === terminalsModalOperatorId) ?? null;

  function closeTerminalsModal() {
    setTerminalsModalOperatorId(null);
    setExistingTerminals([]);
    setPendingTerminals([]);
    setManageTerminalDraft({ name: "", city: "" });
  }

  async function openTerminalsModal(row: PlatformOperatorRow) {
    setTerminalsModalOperatorId(row.id);
    setExistingTerminals([]);
    setPendingTerminals([]);
    setManageTerminalDraft({ name: "", city: "" });
    setTerminalsLoading(true);
    try {
      const rows = await fetchOperatorTerminals(row.id);
      setExistingTerminals(rows);
    } catch (error) {
      await showValidationAlert({
        title: "Could not load terminals",
        text: error instanceof ApiError ? error.message : "Try again in a moment.",
      });
      closeTerminalsModal();
    } finally {
      setTerminalsLoading(false);
    }
  }

  function addPendingTerminal() {
    const name = manageTerminalDraft.name.trim();
    const city = resolveGhanaCityName(manageTerminalDraft.city);
    if (!name || !city) {
      void showValidationAlert({
        title: "Terminal details required",
        text: "Enter the terminal name and choose a city from the list before adding.",
      });
      return;
    }

    setPendingTerminals((current) => [
      ...current,
      { id: crypto.randomUUID(), name, city },
    ]);
    setManageTerminalDraft({ name: "", city: "" });
  }

  function removePendingTerminal(terminalId: string) {
    setPendingTerminals((current) => current.filter((terminal) => terminal.id !== terminalId));
  }

  async function savePendingTerminals() {
    if (!terminalsModalOperatorId || pendingTerminals.length === 0) return;
    setTerminalsSaving(true);
    try {
      const result = await addOperatorTerminals(
        terminalsModalOperatorId,
        pendingTerminals.map((terminal) => ({ name: terminal.name, city: terminal.city })),
      );
      const rows = await fetchOperatorTerminals(terminalsModalOperatorId);
      setExistingTerminals(rows);
      setPendingTerminals([]);
      patchOperatorLocal(terminalsModalOperatorId, {
        stationCount: result.stationCount,
        cityCount: result.cityCount,
      });
      await showSuccessAlert({
        title: "Terminals added",
        text: `${result.created} terminal${result.created === 1 ? "" : "s"} added for ${result.name}.${result.skipped > 0 ? ` ${result.skipped} could not be added.` : ""}`,
      });
    } catch (error) {
      await showValidationAlert({
        title: "Could not add terminals",
        text: error instanceof ApiError ? error.message : "Try again in a moment.",
      });
    } finally {
      setTerminalsSaving(false);
    }
  }

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
    setNetworkInputMode("quick");
    setBulkPasteText("");
    setCityBatchText("");
    setTerminalDraft({ name: "", city: "" });
    setOnboardOpen(true);
  }

  function closeOnboard() {
    setOnboardOpen(false);
    setOnboardStep(1);
    setDraft(EMPTY_DRAFT);
    setNetworkInputMode("quick");
    setBulkPasteText("");
    setCityBatchText("");
    setTerminalDraft({ name: "", city: "" });
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
      const paidOn = draft.subscriptionPaidAt.trim() || draft.agreementDate.trim();
      if (!paidOn) {
        await showValidationAlert({
          title: "Licence start date required",
          text: "Enter when the software purchase was paid, or use the agreement date.",
        });
        return false;
      }
      const expiresAt = computeSubscriptionExpiresAt(
        paidOn,
        draft.subscriptionPlan,
        draft.subscriptionDuration,
      );
      if (!expiresAt) {
        await showValidationAlert({
          title: "Licence duration required",
          text: "Choose a valid software licence plan and duration.",
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
      const allTerminals = mergeTerminalRows(draft.terminals, collectPendingTerminalRows());
      return validateNetworkStep(allTerminals);
    }
    if (step === 4) {
      if (!draft.hqName.trim() || !draft.hqEmail.trim() || !draft.hqPhone.trim()) {
        await showValidationAlert({
          title: "HQ admin required",
          text: "Add the HQ admin name, email, and phone. They sign in with phone + password at /admin/login.",
        });
        return false;
      }
      if (!isValidEmail(draft.hqEmail)) {
        await showValidationAlert({
          title: "HQ email invalid",
          text: "Enter a valid work email for the HQ admin (e.g. hq@company.com).",
        });
        return false;
      }
      const hqPhone = draft.hqPhone.replace(/\s/g, "");
      if (!/^(\+?233|0)?[2-9]\d{8}$/.test(hqPhone)) {
        await showValidationAlert({
          title: "HQ phone invalid",
          text: "Enter a valid Ghana phone number for HQ sign-in (e.g. 0244555666).",
        });
        return false;
      }
    }
    return true;
  }

  async function goNext() {
    if (onboardStep === 3) {
      const ok = await validateStep(3);
      if (!ok) return;
      commitPendingNetworkInput();
      setOnboardStep(4);
      return;
    }

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
      text: `Send temporary credentials by SMS to ${hqAdmin.displayName} (${hqAdmin.phone}). They sign in at /admin/login with that phone number and finish their network setup.`,
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

    setSuspendBusyId(row.id);
    try {
      await toggleSuspend(row.id);
      await showSuccessAlert({
        title: suspending ? "Suspended" : "Resumed",
        text: suspending
          ? `${row.name} is suspended. HQ and branch access can be blocked until you resume.`
          : `${row.name} is active again.`,
        confirmButtonColor: "#fd7e14",
      });
    } catch (error) {
      await showValidationAlert({
        title: "Could not update transport",
        text:
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Something went wrong. Check the API is running and try again.",
      });
    } finally {
      setSuspendBusyId(null);
    }
  }

  async function handleDeleteOperator(row: PlatformOperatorRow) {
    if (isProtectedOperator(row.code)) {
      await showValidationAlert({
        title: "Cannot delete",
        text: `${row.code} is a built-in operator and cannot be removed from Parcela.`,
      });
      return;
    }

    const confirmed = await showConfirmDialog({
      title: `Delete ${row.name}?`,
      text: `This permanently removes ${row.name} (${row.code}), including HQ and staff logins, terminals, parcels, and settings. This cannot be undone.`,
      confirmText: "Delete transport",
      cancelText: "Cancel",
      icon: "warning",
      confirmButtonColor: "#dc2626",
    });
    if (!confirmed) return;

    setDeleteBusyId(row.id);
    try {
      const result = await deleteOperator(row.id);
      if (selectedId === row.id) {
        const remaining = operators.filter((operator) => operator.id !== row.id);
        setSelectedId(remaining[0]?.id ?? null);
      }
      await showSuccessAlert({
        title: "Transport removed",
        text: `${result.operatorName} was deleted. Removed ${result.removed.staffAccounts} account(s), ${result.removed.stations} terminal(s), and ${result.removed.parcels} parcel record(s).`,
        confirmButtonColor: "#fd7e14",
      });
    } catch (error) {
      await showValidationAlert({
        title: "Delete failed",
        text:
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Could not delete this transport.",
      });
    } finally {
      setDeleteBusyId(null);
    }
  }

  function syncNetworkCounts(terminals: OnboardTerminal[]) {
    const cities = new Set(terminals.map((terminal) => terminal.city.trim().toLowerCase()).filter(Boolean));
    return {
      stationCount: terminals.length > 0 ? String(terminals.length) : "",
      cityCount: cities.size > 0 ? String(cities.size) : "",
    };
  }

  function collectPendingTerminalRows(): { name: string; city: string }[] {
    const rows: { name: string; city: string }[] = [];

    if (bulkPasteText.trim()) {
      rows.push(...parseBulkTerminalLines(bulkPasteText).rows);
    }

    const batchCity = resolveGhanaCityName(terminalDraft.city);
    if (batchCity && cityBatchText.trim()) {
      rows.push(...parseTerminalNamesForCity(cityBatchText, batchCity).rows);
    } else if (terminalDraft.name.trim() && batchCity) {
      rows.push({ name: terminalDraft.name.trim(), city: batchCity });
    }

    return rows;
  }

  function mergeTerminalRows(
    existing: OnboardTerminal[],
    pending: { name: string; city: string }[],
  ): OnboardTerminal[] {
    const seen = new Set(
      existing.map((terminal) => `${terminal.name.toLowerCase()}|${terminal.city.toLowerCase()}`),
    );
    const merged = [...existing];
    for (const row of pending) {
      const key = `${row.name.toLowerCase()}|${row.city.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push({ id: crypto.randomUUID(), name: row.name, city: row.city });
    }
    return merged;
  }

  function commitPendingNetworkInput() {
    const pending = collectPendingTerminalRows();
    if (pending.length === 0) return;

    setDraft((current) => {
      const terminals = mergeTerminalRows(current.terminals, pending);
      return { ...current, terminals, ...syncNetworkCounts(terminals) };
    });
    setBulkPasteText("");
    setCityBatchText("");
    if (terminalDraft.name.trim()) {
      setTerminalDraft((current) => ({ ...current, name: "" }));
    }
  }

  async function validateNetworkStep(allTerminals: OnboardTerminal[]): Promise<boolean> {
    if (allTerminals.length > 0) return true;

    const inListMode =
      networkInputMode === "list" ||
      bulkPasteText.trim().length > 0 ||
      cityBatchText.trim().length > 0;

    if (inListMode) {
      if (bulkPasteText.trim()) {
        const { rows } = parseBulkTerminalLines(bulkPasteText);
        if (rows.length === 0) {
          await showValidationAlert({
            title: "Could not read pasted terminals",
            text: 'Use one terminal per line as "Name, City" (e.g. Circle Terminal, Accra). Each line needs a real city name after the comma.',
          });
          return false;
        }
      }

      if (cityBatchText.trim()) {
        const city = resolveGhanaCityName(terminalDraft.city);
        if (!city) {
          await showValidationAlert({
            title: "Choose a city first",
            text: "Select the city for your terminal names before continuing.",
          });
          return false;
        }
        const { rows } = parseTerminalNamesForCity(cityBatchText, city);
        if (rows.length === 0) {
          await showValidationAlert({
            title: "Add terminal names",
            text: "Enter one terminal name per line under your selected city.",
          });
          return false;
        }
      }

      await showValidationAlert({
        title: "Add at least one terminal",
        text: "Paste terminals (Name, City per line), use Add all to city, or add one at a time — then continue.",
      });
      return false;
    }

    const stations = Number(draft.stationCount);
    const cities = Number(draft.cityCount);
    if (!draft.stationCount.trim() || Number.isNaN(stations) || stations < 1) {
      await showValidationAlert({
        title: "How many terminals?",
        text: "Enter an approximate station count, or switch to “List terminals” and add them in bulk.",
      });
      return false;
    }
    if (!draft.cityCount.trim() || Number.isNaN(cities) || cities < 1) {
      await showValidationAlert({
        title: "How many cities?",
        text: "Enter how many cities or corridors this transport covers.",
      });
      return false;
    }
    return true;
  }

  async function addTerminal() {
    const name = terminalDraft.name.trim();
    const city = resolveGhanaCityName(terminalDraft.city);
    if (!name || !city) {
      await showValidationAlert({
        title: "Terminal details required",
        text: "Enter the terminal name and choose a city from the list before adding.",
      });
      return;
    }

    setDraft((current) => {
      const terminals = [...current.terminals, { id: crypto.randomUUID(), name, city }];
      return { ...current, terminals, ...syncNetworkCounts(terminals) };
    });
    setTerminalDraft({ name: "", city: "" });
  }

  function removeTerminal(terminalId: string) {
    setDraft((current) => {
      const terminals = current.terminals.filter((terminal) => terminal.id !== terminalId);
      return { ...current, terminals, ...syncNetworkCounts(terminals) };
    });
  }

  function appendTerminals(rows: { name: string; city: string }[]) {
    if (rows.length === 0) return 0;
    setDraft((current) => {
      const terminals = [
        ...current.terminals,
        ...rows.map((row) => ({
          id: crypto.randomUUID(),
          name: row.name.trim(),
          city: row.city.trim(),
        })),
      ];
      return { ...current, terminals, ...syncNetworkCounts(terminals) };
    });
    return rows.length;
  }

  async function addBulkTerminals() {
    const { rows, skipped } = parseBulkTerminalLines(bulkPasteText);
    if (rows.length === 0) {
      await showValidationAlert({
        title: "Nothing to add",
        text:
          skipped.length > 0
            ? `Use one terminal per line as “Name, City” (e.g. Circle Terminal, Accra). ${skipped.length} line(s) could not be read.`
            : "Paste terminals one per line: Terminal name, City",
      });
      return;
    }

    appendTerminals(rows);
    setBulkPasteText("");
    setNetworkInputMode("list");

    if (skipped.length > 0) {
      await showValidationAlert({
        title: `${rows.length} terminal${rows.length === 1 ? "" : "s"} added`,
        text: `${skipped.length} line(s) were skipped — use “Name, City” on each line.`,
      });
    }
  }

  async function addCityBatchTerminals() {
    const city = resolveGhanaCityName(terminalDraft.city);
    if (!city) {
      await showValidationAlert({
        title: "Choose a city first",
        text: "Select the city these terminals belong to, then paste the terminal names.",
      });
      return;
    }

    const { rows } = parseTerminalNamesForCity(cityBatchText, city);
    if (rows.length === 0) {
      await showValidationAlert({
        title: "Add terminal names",
        text: "Enter one terminal name per line (e.g. Circle Terminal, Kaneshie, Madina).",
      });
      return;
    }

    appendTerminals(rows);
    setCityBatchText("");
    setNetworkInputMode("list");
  }

  async function handleLogoPick(file: File | null) {
    if (!file) return;
    setLogoUploading(true);
    try {
      const result = await readOperatorLogoFile(file);
      setDraft((d) => ({
        ...d,
        logoDataUrl: result.dataUrl,
        logoFileName: result.fileName,
      }));
    } catch (error) {
      await showValidationAlert({
        title: "Logo not accepted",
        text: error instanceof Error ? error.message : "Could not use that image.",
      });
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  }

  async function submitOnboard() {
    for (const step of [1, 4] as const) {
      const ok = await validateStep(step);
      if (!ok) return;
    }

    const pending = collectPendingTerminalRows();
    const allTerminals = mergeTerminalRows(draft.terminals, pending);
    if (!(await validateNetworkStep(allTerminals))) return;

    setSaving(true);
    try {
      const terminals = allTerminals.map((terminal) => ({
        name: terminal.name.trim(),
        city: terminal.city.trim(),
      }));
      const next = await createOperator({
        name: draft.name.trim(),
        code: draft.code.trim(),
        region: draft.region.trim() || "Ghana",
        contactEmail: draft.contactEmail.trim() || undefined,
        contactPhone: draft.contactPhone.trim() || undefined,
        brandColor: draft.brandColor || "#fd7e14",
        logoDataUrl: draft.logoDataUrl ?? undefined,
        cityCount: Math.max(
          1,
          terminals.length > 0
            ? new Set(terminals.map((terminal) => terminal.city.toLowerCase())).size
            : Number(draft.cityCount) || 1,
        ),
        stationCount: Math.max(
          1,
          terminals.length > 0 ? terminals.length : Number(draft.stationCount) || 1,
        ),
        terminals: terminals.length > 0 ? terminals : undefined,
        notes: draft.notes.trim() || undefined,
        agreementDate: draft.agreementDate,
        hqName: draft.hqName.trim(),
        hqEmail: draft.hqEmail.trim().toLowerCase(),
        hqPhone: draft.hqPhone.trim() || undefined,
        issueLoginsNow: draft.issueLoginsNow,
        subscriptionPlan: draft.subscriptionPlan,
        subscriptionDuration: draft.subscriptionDuration,
        subscriptionPaidAt: draft.subscriptionPaidAt.trim() || draft.agreementDate,
        subscriptionAmountGhs: draft.subscriptionAmountGhs.trim()
          ? Number(draft.subscriptionAmountGhs)
          : undefined,
      });
      setSelectedId(next.id);
      closeOnboard();
      await showSuccessAlert({
        title: "Transport onboarded",
        text: `${next.name} is on Parcela with status Configure. ${platformOnboardSmsText(
          draft.issueLoginsNow,
          next.hqSmsSent,
          draft.hqPhone.trim(),
          next.hqTemporaryPassword,
        )}`,
        confirmButtonColor: "#fd7e14",
      });
    } catch (error) {
      await showValidationAlert({
        title: "Could not onboard transport",
        text:
          error instanceof ApiError
            ? error.status === 413
              ? "The logo or form data is too large. Use a logo under 400 KB, or onboard without a logo first."
              : error.message
            : "Something went wrong while creating this transport. Try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="operator-portal-main">
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

          {filtered.length > 0 ? (
            <div className="space-y-2.5 p-3 xl:hidden">
              {listPagination.pageItems.map((row, index) => {
                const active = selected?.id === row.id;
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setSelectedId(row.id)}
                    className={cn(
                      "w-full rounded-xl border p-3 text-left shadow-sm transition-colors",
                      active
                        ? "border-[var(--platform-orange)] bg-[var(--platform-orange-soft)]"
                        : "border-stone-200 bg-white hover:border-[var(--platform-orange)]/40",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <PlatformOperatorMark
                        code={row.code}
                        name={row.name}
                        brandColor={row.brandColor}
                        logoDataUrl={row.logoDataUrl}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-display truncate text-sm font-bold text-stone-900">
                              {row.name}
                            </p>
                            <p className="font-mono text-[11px] text-stone-500">{row.code}</p>
                          </div>
                          <span
                            className={cn(
                              "shrink-0 font-display inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1 ring-inset",
                              operatorStatusTone(row.status),
                            )}
                          >
                            {operatorStatusLabel(row.status)}
                          </span>
                        </div>
                        <p className="font-body mt-2 text-xs text-stone-600">
                          {row.region} · {row.stationCount} stations · {row.hqAdminCount} HQ
                        </p>
                        <p className="font-body mt-1 text-[10px] text-stone-400">
                          Updated {formatPlatformWhen(row.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="hidden xl:block operator-portal-table-scroll overflow-x-auto">
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
                              logoDataUrl={row.logoDataUrl}
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
                    logoDataUrl={selected.logoDataUrl}
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
                  {selectedHq[0]?.phone ?? "—"}
                </p>
                {selected.primaryAdminEmail ? (
                  <p className="font-body mt-0.5 text-[10px] text-stone-400">
                    {selected.primaryAdminEmail}
                  </p>
                ) : null}
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
                          <th className="font-display px-3 py-2 font-bold">Login phone</th>
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
                              {person.phone}
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

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditOperatorId(selected.id)}
                  className="font-display inline-flex items-center justify-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide text-sky-800 hover:bg-sky-100"
                >
                  <Edit2 className="size-3.5 shrink-0" />
                  <span className="truncate">Edit branding</span>
                </button>
                <button
                  type="button"
                  onClick={() => void openTerminalsModal(selected)}
                  className="font-display inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide text-emerald-800 hover:bg-emerald-100"
                >
                  <MapPin className="size-3.5 shrink-0" />
                  <span className="truncate">Add stations</span>
                </button>
                {selected.status !== "configured" && selected.status !== "suspended" ? (
                  <button
                    type="button"
                    onClick={() => void handleMarkConfigured(selected)}
                    className="font-display col-span-2 inline-flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide text-white hover:brightness-110"
                    style={{ background: "var(--platform-orange)" }}
                  >
                    <CheckCircle2 className="size-3.5 shrink-0" />
                    Mark configured
                  </button>
                ) : null}
                {selected.status === "configured" ? (
                  <button
                    type="button"
                    onClick={() => openConfigurationLetter(selected)}
                    className="font-display inline-flex items-center justify-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide text-violet-800 hover:bg-violet-100"
                  >
                    <FileText className="size-3.5 shrink-0" />
                    <span className="truncate">Config letter</span>
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => void handleIssueHqLogins(selected)}
                  className="font-display inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide text-amber-900 hover:bg-amber-100"
                >
                  <KeyRound className="size-3.5 shrink-0" />
                  <span className="truncate">Issue HQ logins</span>
                </button>
                <button
                  type="button"
                  disabled={suspendBusyId === selected.id}
                  onClick={() => void handleToggleSuspend(selected)}
                  className={cn(
                    "font-display inline-flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide",
                    selected.status === "suspended"
                      ? "border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100"
                      : "border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100",
                    suspendBusyId === selected.id && "cursor-wait opacity-70",
                  )}
                >
                  {suspendBusyId === selected.id ? (
                    <>
                      <Loader2 className="size-3.5 shrink-0 animate-spin" />
                      <span className="truncate">
                        {selected.status === "suspended" ? "Resuming…" : "Suspending…"}
                      </span>
                    </>
                  ) : selected.status === "suspended" ? (
                    <>
                      <PlayCircle className="size-3.5 shrink-0" />
                      <span className="truncate">Resume</span>
                    </>
                  ) : (
                    <>
                      <PauseCircle className="size-3.5 shrink-0" />
                      <span className="truncate">Suspend</span>
                    </>
                  )}
                </button>
                {!isProtectedOperator(selected.code) ? (
                  <button
                    type="button"
                    disabled={deleteBusyId === selected.id}
                    onClick={() => void handleDeleteOperator(selected)}
                    className={cn(
                      "font-display inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide text-red-700 hover:bg-red-100",
                      deleteBusyId === selected.id && "cursor-wait opacity-70",
                    )}
                  >
                    {deleteBusyId === selected.id ? (
                      <>
                        <Loader2 className="size-3.5 shrink-0 animate-spin" />
                        <span className="truncate">Deleting…</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="size-3.5 shrink-0" />
                        <span className="truncate">Delete</span>
                      </>
                    )}
                  </button>
                ) : null}
                <Link
                  href="/platform/hq-admins"
                  className="font-display inline-flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide text-indigo-800 hover:bg-indigo-100"
                >
                  <span className="truncate">HQ admins</span>
                  <ArrowRight className="size-3.5 shrink-0" />
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
                      onChange={(e) => {
                        const agreementDate = e.target.value;
                        setDraft((d) => ({
                          ...d,
                          agreementDate,
                          subscriptionPaidAt: d.subscriptionPaidAt || agreementDate,
                        }));
                      }}
                    />
                    <p className="font-body mt-1.5 text-[11px] text-stone-500">
                      Commercial terms are agreed before onboarding. A configuration letter is auto-generated
                      when setup is complete.
                    </p>
                  </div>

                  <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                    <p className="font-display text-[11px] font-bold uppercase tracking-wider text-stone-500">
                      Software licence (for renewal countdown)
                    </p>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="op-licence-plan" className={labelClass}>
                          Licence type
                        </label>
                        <select
                          id="op-licence-plan"
                          className={inputClass}
                          value={draft.subscriptionPlan}
                          onChange={(e) => {
                            const subscriptionPlan = e.target.value as SubscriptionPlan;
                            setDraft((d) => ({
                              ...d,
                              subscriptionPlan,
                              subscriptionDuration: defaultLicenceDuration(subscriptionPlan),
                            }));
                          }}
                        >
                          <option value="annual">Annual licence</option>
                          <option value="trial">Trial</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="op-licence-duration" className={labelClass}>
                          Duration
                        </label>
                        <select
                          id="op-licence-duration"
                          className={inputClass}
                          value={draft.subscriptionDuration}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, subscriptionDuration: e.target.value }))
                          }
                        >
                          {licenceDurationOptions(draft.subscriptionPlan).map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="op-licence-paid" className={labelClass}>
                          Paid on
                        </label>
                        <input
                          id="op-licence-paid"
                          type="date"
                          className={inputClass}
                          value={draft.subscriptionPaidAt || draft.agreementDate}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, subscriptionPaidAt: e.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <label htmlFor="op-licence-amount" className={labelClass}>
                          Amount (GHS)
                        </label>
                        <input
                          id="op-licence-amount"
                          type="number"
                          min={0}
                          className={inputClass}
                          value={draft.subscriptionAmountGhs}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, subscriptionAmountGhs: e.target.value }))
                          }
                          placeholder="e.g. 12000"
                        />
                      </div>
                    </div>
                    <p className="font-body mt-3 text-xs text-stone-600">
                      Renews on{" "}
                      <strong>
                        {formatLicenceExpiryLabel(
                          computeSubscriptionExpiresAt(
                            draft.subscriptionPaidAt || draft.agreementDate,
                            draft.subscriptionPlan,
                            draft.subscriptionDuration,
                          ),
                        )}
                      </strong>
                      . This powers the subscription countdown and renewal reminders.
                    </p>
                  </div>
                </div>
              )}

              {onboardStep === 2 && (
                <div className="space-y-5">
                  <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
                    <p className="font-body text-sm leading-relaxed text-stone-600">
                      Brand colour and logo for their HQ portal. PNG, JPEG, or WebP up to 400 KB.
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
                        logoDataUrl={draft.logoDataUrl}
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

                  <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-display text-sm font-semibold text-stone-700">Operator logo</p>
                        <p className="font-body mt-1 text-xs text-stone-500">
                          {draft.logoFileName
                            ? `Selected: ${draft.logoFileName}`
                            : "Optional — shown on platform views and configuration letters."}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => void handleLogoPick(e.target.files?.[0] ?? null)}
                        />
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          disabled={logoUploading}
                          className="font-display inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-stone-700 shadow-sm transition-colors hover:border-stone-300 disabled:opacity-60"
                        >
                          <Upload className="size-3.5" />
                          {logoUploading ? "Reading…" : draft.logoDataUrl ? "Replace logo" : "Upload logo"}
                        </button>
                        {draft.logoDataUrl ? (
                          <button
                            type="button"
                            onClick={() =>
                              setDraft((d) => ({ ...d, logoDataUrl: null, logoFileName: "" }))
                            }
                            className="font-display inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wide text-stone-500 hover:text-red-600"
                          >
                            <X className="size-3.5" />
                            Remove
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {onboardStep === 3 && (
                <div className="space-y-5">
                  <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
                    <p className="font-body text-sm leading-relaxed text-stone-600">
                      Use a quick estimate if HQ will add stations later, or paste your full terminal
                      list now — counts update automatically when you add terminals.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setNetworkInputMode("quick")}
                      className={cn(
                        "font-display rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors",
                        networkInputMode === "quick"
                          ? "border-[var(--platform-orange)] bg-[var(--platform-orange-soft)] text-[var(--platform-orange-dark)]"
                          : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50",
                      )}
                    >
                      Quick estimate
                    </button>
                    <button
                      type="button"
                      onClick={() => setNetworkInputMode("list")}
                      className={cn(
                        "font-display rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors",
                        networkInputMode === "list"
                          ? "border-[var(--platform-orange)] bg-[var(--platform-orange-soft)] text-[var(--platform-orange-dark)]"
                          : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50",
                      )}
                    >
                      List terminals
                    </button>
                  </div>

                  {draft.terminals.length > 0 ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3">
                      <p className="font-display text-xs font-bold uppercase tracking-wide text-emerald-800">
                        Network summary
                      </p>
                      <p className="font-body mt-1 text-sm text-emerald-900">
                        {draft.terminals.length} terminal{draft.terminals.length === 1 ? "" : "s"} across{" "}
                        {draft.cityCount || "—"} cit{Number(draft.cityCount) === 1 ? "y" : "ies"}
                      </p>
                    </div>
                  ) : null}

                  {networkInputMode === "quick" ? (
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
                          disabled={draft.terminals.length > 0}
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
                          disabled={draft.terminals.length > 0}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-stone-200 bg-white p-4">
                        <p className="font-display text-[11px] font-bold uppercase tracking-wider text-stone-500">
                          Paste many at once
                        </p>
                        <p className="font-body mt-1 text-xs text-stone-500">
                          One terminal per line:{" "}
                          <span className="font-mono text-stone-600">Terminal name, City</span>
                          {" · "}
                          <span className="text-stone-600">Continue adds pasted lines automatically.</span>
                        </p>
                        <textarea
                          rows={4}
                          className={cn(inputClass, "mt-3 font-mono text-xs")}
                          value={bulkPasteText}
                          onChange={(e) => setBulkPasteText(e.target.value)}
                          placeholder={`Circle Terminal, Accra\nKejetia, Kumasi\nTakoradi Station, Sekondi-Takoradi`}
                        />
                        <button
                          type="button"
                          onClick={() => void addBulkTerminals()}
                          className="font-display mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white"
                          style={{ background: "var(--platform-orange)" }}
                        >
                          <Plus className="size-3.5" />
                          Add from paste
                        </button>
                      </div>

                      <div className="rounded-xl border border-stone-200 bg-white p-4">
                        <p className="font-display text-[11px] font-bold uppercase tracking-wider text-stone-500">
                          Add all terminals in one city
                        </p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div>
                            <label htmlFor="batch-city" className={labelClass}>
                              City
                            </label>
                            <GhanaCitySelect
                              id="batch-city"
                              className={inputClass}
                              value={terminalDraft.city}
                              onChange={(city) =>
                                setTerminalDraft((current) => ({ ...current, city }))
                              }
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label htmlFor="batch-names" className={labelClass}>
                              Terminal names (one per line)
                            </label>
                            <textarea
                              id="batch-names"
                              rows={3}
                              className={inputClass}
                              value={cityBatchText}
                              onChange={(e) => setCityBatchText(e.target.value)}
                              placeholder={`Circle Terminal\nKaneshie\nMadina`}
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => void addCityBatchTerminals()}
                          className="font-display mt-3 inline-flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-stone-800 hover:bg-stone-50"
                        >
                          <Plus className="size-3.5" />
                          Add all to city
                        </button>
                      </div>

                      <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/80 p-4">
                        <p className="font-display text-[11px] font-bold uppercase tracking-wider text-stone-500">
                          Or add one at a time
                        </p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                          <div>
                            <label htmlFor="terminal-name" className={labelClass}>
                              Terminal name
                            </label>
                            <input
                              id="terminal-name"
                              className={inputClass}
                              value={terminalDraft.name}
                              onChange={(e) =>
                                setTerminalDraft((current) => ({ ...current, name: e.target.value }))
                              }
                              placeholder="e.g. Circle Terminal"
                            />
                          </div>
                          <div>
                            <label htmlFor="terminal-city" className={labelClass}>
                              City
                            </label>
                            <GhanaCitySelect
                              id="terminal-city"
                              className={inputClass}
                              value={terminalDraft.city}
                              onChange={(city) =>
                                setTerminalDraft((current) => ({ ...current, city }))
                              }
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => void addTerminal()}
                              className="font-display inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white sm:w-auto"
                              style={{ background: "var(--platform-orange)" }}
                            >
                              <Plus className="size-3.5" />
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {draft.terminals.length > 0 ? (
                    <div className="rounded-xl border border-stone-200 bg-white p-4">
                      <p className="font-display text-[11px] font-bold uppercase tracking-wider text-stone-500">
                        Terminals added ({draft.terminals.length})
                      </p>
                      <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
                        {draft.terminals.map((terminal, index) => (
                          <li
                            key={terminal.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5"
                          >
                            <div className="min-w-0">
                              <p className="font-display truncate text-sm font-semibold text-stone-900">
                                {index + 1}. {terminal.name}
                              </p>
                              <p className="font-body text-xs text-stone-500">{terminal.city}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeTerminal(terminal.id)}
                              className="font-display shrink-0 text-[11px] font-bold uppercase tracking-wide text-stone-500 hover:text-red-600"
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

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
                        HQ login phone
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
                        logoDataUrl={draft.logoDataUrl}
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
                          {draft.terminals.length > 0
                            ? ` (${draft.terminals.length} terminal${draft.terminals.length === 1 ? "" : "s"} listed)`
                            : ""}
                        </dd>
                      </div>
                      {draft.terminals.length > 0 ? (
                        <div className="sm:col-span-2">
                          <dt className="font-display text-[10px] font-bold uppercase text-stone-400">
                            Terminals
                          </dt>
                          <dd className="font-body text-stone-800">
                            {draft.terminals
                              .map((terminal) => `${terminal.name} (${terminal.city})`)
                              .join(" · ")}
                          </dd>
                        </div>
                      ) : null}
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
                      <div>
                        <dt className="font-display text-[10px] font-bold uppercase text-stone-400">
                          Software licence
                        </dt>
                        <dd className="font-body text-stone-800">
                          {draft.subscriptionPlan === "trial" ? "Trial" : "Annual"} ·{" "}
                          {
                            licenceDurationOptions(draft.subscriptionPlan).find(
                              (option) => option.value === draft.subscriptionDuration,
                            )?.label ?? draft.subscriptionDuration
                          }
                          {draft.subscriptionAmountGhs
                            ? ` · GHS ${Number(draft.subscriptionAmountGhs).toLocaleString()}`
                            : ""}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-display text-[10px] font-bold uppercase text-stone-400">
                          Renews on
                        </dt>
                        <dd className="font-body text-stone-800">
                          {formatLicenceExpiryLabel(
                            computeSubscriptionExpiresAt(
                              draft.subscriptionPaidAt || draft.agreementDate,
                              draft.subscriptionPlan,
                              draft.subscriptionDuration,
                            ),
                          )}
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

      {terminalsModalOperator ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-sm">
          <div
            className="platform-portal flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl"
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
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <PlatformOperatorMark
                    code={terminalsModalOperator.code}
                    name={terminalsModalOperator.name}
                    brandColor={terminalsModalOperator.brandColor}
                    logoDataUrl={terminalsModalOperator.logoDataUrl}
                    size="sm"
                  />
                  <div>
                    <h2 className="font-display text-lg font-bold tracking-tight">
                      Stations & terminals
                    </h2>
                    <p className="font-body mt-1 text-sm text-white/85">
                      {terminalsModalOperator.name} — add more terminals anytime after onboarding.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeTerminalsModal}
                  className="rounded-lg border border-white/20 bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
                <p className="font-display text-[10px] font-bold uppercase tracking-wide text-stone-500">
                  Current network
                </p>
                {terminalsLoading ? (
                  <p className="font-body mt-2 flex items-center gap-2 text-sm text-stone-600">
                    <Loader2 className="size-4 animate-spin" />
                    Loading terminals…
                  </p>
                ) : existingTerminals.length === 0 ? (
                  <p className="font-body mt-2 text-sm text-stone-600">
                    No terminals yet — add the first one below.
                  </p>
                ) : (
                  <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
                    {existingTerminals.map((terminal, index) => (
                      <li
                        key={terminal.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="font-display truncate text-sm font-semibold text-stone-900">
                            {index + 1}. {terminal.name}
                          </p>
                          <p className="font-body text-xs text-stone-500">{terminal.city}</p>
                        </div>
                        <span className="font-mono shrink-0 text-[10px] text-stone-400">
                          {terminal.code}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-5 rounded-xl border border-stone-200 bg-white p-4">
                <p className="font-display text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Add new terminals
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <div>
                    <label htmlFor="manage-terminal-name" className={labelClass}>
                      Terminal name
                    </label>
                    <input
                      id="manage-terminal-name"
                      className={inputClass}
                      value={manageTerminalDraft.name}
                      onChange={(event) =>
                        setManageTerminalDraft((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="e.g. Circle Terminal"
                    />
                  </div>
                  <div>
                    <label htmlFor="manage-terminal-city" className={labelClass}>
                      City
                    </label>
                    <GhanaCitySelect
                      id="manage-terminal-city"
                      className={inputClass}
                      value={manageTerminalDraft.city}
                      onChange={(city) =>
                        setManageTerminalDraft((current) => ({ ...current, city }))
                      }
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => addPendingTerminal()}
                      className="font-display inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white sm:w-auto"
                      style={{ background: "var(--platform-orange)" }}
                    >
                      <Plus className="size-3.5" />
                      Add
                    </button>
                  </div>
                </div>

                {pendingTerminals.length > 0 ? (
                  <ul className="mt-4 space-y-2">
                    {pendingTerminals.map((terminal, index) => (
                      <li
                        key={terminal.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="font-display truncate text-sm font-semibold text-stone-900">
                            New {index + 1}. {terminal.name}
                          </p>
                          <p className="font-body text-xs text-stone-500">{terminal.city}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removePendingTerminal(terminal.id)}
                          className="font-display shrink-0 text-[11px] font-bold uppercase tracking-wide text-stone-500 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="font-body mt-3 text-xs text-stone-500">
                    Choose a city, enter each terminal name, then save to update this transport&apos;s
                    network.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-stone-100 bg-white px-5 py-4">
              <button
                type="button"
                onClick={closeTerminalsModal}
                className="font-display rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-stone-700 transition-colors hover:bg-stone-50"
              >
                Close
              </button>
              <button
                type="button"
                disabled={terminalsSaving || pendingTerminals.length === 0}
                onClick={() => void savePendingTerminals()}
                className="font-display inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-md transition-opacity hover:opacity-95 disabled:opacity-60"
                style={{ background: "var(--platform-orange)" }}
              >
                {terminalsSaving ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    Save {pendingTerminals.length > 0 ? `${pendingTerminals.length} ` : ""}
                    terminal{pendingTerminals.length === 1 ? "" : "s"}
                  </>
                )}
              </button>
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

      {editOperator ? (
        <PlatformEditOperatorModal
          operator={editOperator}
          onClose={() => setEditOperatorId(null)}
        />
      ) : null}
    </main>
  );
}
