import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CalendarDays,
  Clock,
  FileText,
  Layers,
  Package,
} from "lucide-react";
import { brandColorStaffTheme, hexToRgbTuple } from "@/lib/brand-color-theme";
import { getOperatorStaffTheme } from "@/lib/operator-theme";
import { getOperatorLabel, getOperatorLogoSrc } from "@/lib/operators";

export type AdminReportModule = {
  id: AdminReportModuleId;
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  summary: string;
};

export type AdminReportModuleId =
  | "activities"
  | "cross-branch"
  | "delayed-parcels"
  | "branch-performance"
  | "parcel-register";

export const ADMIN_REPORT_MODULES: AdminReportModule[] = [
  {
    id: "parcel-register",
    label: "Parcel register",
    href: "/admin/reports/parcel-register",
    icon: Package,
    description:
      "Full parcel list with sender, receiver, stations, timestamps, and parcel codes — filter and export.",
    summary: "Sender/receiver register across the operator network.",
  },
  {
    id: "activities",
    label: "Activities",
    href: "/admin/reports/activities",
    icon: CalendarDays,
    description:
      "Parcels logged, collected, and in transit across all branches — filter by any period.",
    summary: "Operator-wide parcel movement for the period you choose.",
  },
  {
    id: "cross-branch",
    label: "Cross-branch rollup",
    href: "/admin/reports/cross-branch",
    icon: Layers,
    description: "Operator-wide totals and branch comparisons for management review.",
    summary: "HQ rollup across every terminal.",
  },
  {
    id: "delayed-parcels",
    label: "Delayed parcels",
    href: "/admin/reports/delayed-parcels",
    icon: Clock,
    description: "Parcels overdue for collection or stuck in transit too long.",
    summary: "Exceptions that need HQ attention.",
  },
  {
    id: "branch-performance",
    label: "Branch performance",
    href: "/admin/reports/branch-performance",
    icon: Building2,
    description: "Terminal-by-terminal volume, staff activity, and lead coverage.",
    summary: "How each branch is performing.",
  },
];

export const ADMIN_REPORTS_HUB = {
  label: "All reports",
  href: "/admin/reports",
  icon: FileText,
  description: "Browse every HQ report module. Each report opens on its own page.",
} as const;

export function getAdminReportModule(id: string): AdminReportModule | undefined {
  return ADMIN_REPORT_MODULES.find((module) => module.id === id);
}

export type AdminReportColumn = { key: string; label: string };
export type AdminReportRow = Record<string, string | number | null | undefined>;
export type AdminReportSummaryMetric = {
  label: string;
  value: string;
  highlight?: boolean;
};

export type AdminReportResult = {
  columns: AdminReportColumn[];
  rows: AdminReportRow[];
  summary: AdminReportSummaryMetric[];
};

export type AdminReportFilter = {
  moduleId: AdminReportModuleId;
  dateFrom: string;
  dateTo: string;
  city: string;
  branchId: string;
};

export type AdminReportMeta = {
  companyName: string;
  companyTagline: string;
  operator: string;
  reportTitle: string;
  periodLabel: string;
  generatedBy: string;
  generatedAt: string;
  scopeLabel: string;
  logoSrc: string | null;
  accentColor: string;
  accentRgb: [number, number, number];
};

export function getDefaultAdminReportDateRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 6);
  return {
    dateFrom: toIsoDate(from),
    dateTo: toIsoDate(to),
  };
}

export function formatAdminReportPeriod(dateFrom: string, dateTo: string) {
  if (dateFrom === dateTo) return formatDisplayDate(dateFrom);
  return `${formatDisplayDate(dateFrom)} – ${formatDisplayDate(dateTo)}`;
}

export function buildAdminReportMeta(input: {
  operator: string;
  reportTitle: string;
  periodLabel: string;
  generatedBy: string;
  scopeLabel: string;
  companyName?: string | null;
  logoSrc?: string | null;
  brandColor?: string | null;
}): AdminReportMeta {
  const code = input.operator.toUpperCase();
  const theme = input.brandColor?.trim()
    ? brandColorStaffTheme(input.brandColor)
    : getOperatorStaffTheme(code);
  const companyName = input.companyName?.trim() || getOperatorLabel(code);
  const logoSrc = input.logoSrc?.trim() || getOperatorLogoSrc(code);
  return {
    companyName,
    companyTagline: `${companyName} terminal parcel operations report`,
    operator: code,
    reportTitle: input.reportTitle,
    periodLabel: input.periodLabel,
    generatedBy: input.generatedBy,
    generatedAt: new Date().toLocaleString("en-GH", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    scopeLabel: input.scopeLabel,
    logoSrc,
    accentColor: theme.accent,
    accentRgb: hexToRgbTuple(theme.accent),
  };
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDisplayDate(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  return date.toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
