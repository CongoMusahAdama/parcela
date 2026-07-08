import type { Operator, ParcelTrackStatus } from "@/types/parcel";
import type { StaffParcelSummary } from "@/types/staff-parcel";
import { getCollectionQueueParcels } from "@/types/staff-parcel";
import { toStaffParcelDetail } from "@/types/staff-parcel";
import { getOperatorStaffTheme } from "@/lib/operator-theme";
import { OPERATOR_LOGOS, OPERATOR_REPORT_BRAND } from "@/lib/operators";
import { TRACK_STATUS_LABELS } from "@/lib/tracking";

export const STORAGE_FEE_PER_DAY_GHS = 5;

export type StaffReportType =
  | "daily_summary"
  | "overdue_collection"
  | "pickup_register"
  | "bus_handover"
  | "all_parcels"
  | "pending_dropoff"
  | "verified_logged"
  | "in_transit"
  | "arrived"
  | "ready_for_collection"
  | "collected"
  | "master_record";

export type ReportCategory = "management" | "operations";

export type StaffReportTypeConfig = {
  id: StaffReportType;
  label: string;
  description: string;
  relatedPage: string;
  category: ReportCategory;
};

export const STAFF_REPORT_TYPE_GROUPS: Array<{ category: ReportCategory; label: string }> = [
  { category: "management", label: "Management reports" },
  { category: "operations", label: "Operational reports" },
];

export const STAFF_REPORT_TYPES: StaffReportTypeConfig[] = [
  {
    id: "daily_summary",
    label: "Daily station summary",
    description: "End-of-day totals by status — ideal for terminal managers and HQ reviews.",
    relatedPage: "Overview",
    category: "management",
  },
  {
    id: "overdue_collection",
    label: "Overdue collection / storage fees",
    description: "Parcels waiting too long at the terminal with estimated ₵5/day storage charges.",
    relatedPage: "Collection queue",
    category: "management",
  },
  {
    id: "pickup_register",
    label: "Recipient pickup register",
    description: "Station handover book — who collected each parcel, when, and contact details.",
    relatedPage: "Recipient pickup",
    category: "management",
  },
  {
    id: "bus_handover",
    label: "Bus handover log",
    description: "Parcels received from or sent on buses — accountability with drivers.",
    relatedPage: "Incoming buses",
    category: "management",
  },
  {
    id: "all_parcels",
    label: "All parcels",
    description: "Every parcel linked to your station in the selected period.",
    relatedPage: "Overview",
    category: "operations",
  },
  {
    id: "pending_dropoff",
    label: "Awaiting drop-off",
    description: "Sender bookings not yet dropped off at the counter.",
    relatedPage: "Awaiting drop-off",
    category: "operations",
  },
  {
    id: "verified_logged",
    label: "Verified & logged",
    description: "Parcels verified at the counter and assigned to a bus.",
    relatedPage: "Verify & log",
    category: "operations",
  },
  {
    id: "in_transit",
    label: "In transit",
    description: "Parcels currently travelling on buses.",
    relatedPage: "In transit",
    category: "operations",
  },
  {
    id: "arrived",
    label: "Incoming buses",
    description: "Parcels received from arriving buses at your station.",
    relatedPage: "Incoming buses",
    category: "operations",
  },
  {
    id: "ready_for_collection",
    label: "Collection queue",
    description: "Parcels waiting at the terminal for recipient pickup.",
    relatedPage: "Collection queue",
    category: "operations",
  },
  {
    id: "collected",
    label: "Recipient pickup",
    description: "Parcels released to recipients after pickup verification.",
    relatedPage: "Recipient pickup",
    category: "operations",
  },
  {
    id: "master_record",
    label: "Master station record",
    description: "Full audit trail for record keeping and terminal reporting.",
    relatedPage: "All pages",
    category: "operations",
  },
];

export type ReportColumn = { key: string; label: string };
export type ReportRow = Record<string, string | number>;

export type StaffReportSummaryMetric = {
  label: string;
  value: string | number;
  highlight?: boolean;
};

export type StaffReportResult = {
  columns: ReportColumn[];
  rows: ReportRow[];
  summary: StaffReportSummaryMetric[];
};

export type StaffReportFilter = {
  reportType: StaffReportType;
  dateFrom: string;
  dateTo: string;
};

export const STANDARD_REPORT_COLUMNS: ReportColumn[] = [
  { key: "reference", label: "Reference" },
  { key: "pickupCode", label: "Pickup code" },
  { key: "status", label: "Status" },
  { key: "sender", label: "Sender" },
  { key: "senderPhone", label: "Sender phone" },
  { key: "recipient", label: "Recipient" },
  { key: "recipientPhone", label: "Recipient phone" },
  { key: "origin", label: "Origin" },
  { key: "destination", label: "Destination" },
  { key: "direction", label: "Direction" },
  { key: "items", label: "Items" },
  { key: "busNumber", label: "Bus" },
  { key: "created", label: "Created" },
  { key: "updated", label: "Updated" },
];

function formatReportDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseDateBoundary(value: string, endOfDay: boolean) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  return date.getTime();
}

export function isParcelInDateRange(
  parcel: StaffParcelSummary,
  dateFrom: string,
  dateTo: string
) {
  const start = parseDateBoundary(dateFrom, false);
  const end = parseDateBoundary(dateTo, true);
  if (start === null || end === null) return false;

  const updated = new Date(parcel.updatedAt).getTime();
  const created = new Date(parcel.createdAt).getTime();
  return (updated >= start && updated <= end) || (created >= start && created <= end);
}

export function getDaysWaiting(parcel: StaffParcelSummary) {
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(parcel.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
  );
}

const REPORT_STATUS_MAP: Record<StaffReportType, ParcelTrackStatus[] | "all"> = {
  daily_summary: "all",
  overdue_collection: ["ready_for_collection"],
  pickup_register: ["collected"],
  bus_handover: ["in_transit", "arrived", "ready_for_collection", "collected"],
  all_parcels: "all",
  master_record: "all",
  pending_dropoff: ["pending_dropoff"],
  verified_logged: ["in_transit"],
  in_transit: ["in_transit"],
  arrived: ["arrived"],
  ready_for_collection: ["ready_for_collection"],
  collected: ["collected"],
};

export function filterParcelsForReport(
  parcels: StaffParcelSummary[],
  filter: StaffReportFilter
) {
  const statusFilter = REPORT_STATUS_MAP[filter.reportType];

  return parcels
    .filter((parcel) => isParcelInDateRange(parcel, filter.dateFrom, filter.dateTo))
    .filter((parcel) => {
      if (statusFilter === "all") return true;
      if (!statusFilter.includes(parcel.status)) return false;
      if (filter.reportType === "verified_logged") {
        return parcel.direction === "outgoing";
      }
      if (filter.reportType === "arrived") {
        return parcel.direction === "incoming";
      }
      if (filter.reportType === "bus_handover") {
        return Boolean(toStaffParcelDetail(parcel).busNumber);
      }
      if (filter.reportType === "overdue_collection") {
        return getDaysWaiting(parcel) >= 1;
      }
      return true;
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

function parcelToStandardRow(parcel: StaffParcelSummary): ReportRow {
  const detail = toStaffParcelDetail(parcel);
  return {
    reference: parcel.bookingReference,
    pickupCode: parcel.pickupCode,
    status: TRACK_STATUS_LABELS[parcel.status],
    sender: parcel.senderName,
    senderPhone: parcel.senderPhone,
    recipient: parcel.recipientName,
    recipientPhone: parcel.recipientPhone,
    origin: parcel.originStationName,
    destination: parcel.destinationStationName,
    direction: parcel.direction === "outgoing" ? "Outgoing" : "Incoming",
    items: parcel.itemCount,
    busNumber: detail.busNumber ?? "—",
    created: formatReportDate(parcel.createdAt),
    updated: formatReportDate(parcel.updatedAt),
  };
}

function buildDailySummary(parcels: StaffParcelSummary[]): StaffReportResult {
  const overdue = getCollectionQueueParcels(parcels).filter(
    (p) => getDaysWaiting(p) >= 1,
  );
  const totalFees = overdue.reduce(
    (sum, p) => sum + getDaysWaiting(p) * STORAGE_FEE_PER_DAY_GHS,
    0
  );

  const rows: ReportRow[] = [
    { category: "Total parcels", count: parcels.length, notes: "All activity in period" },
    {
      category: "Incoming parcels",
      count: parcels.filter((p) => p.direction === "incoming").length,
      notes: "Received at this terminal",
    },
    {
      category: "Outgoing parcels",
      count: parcels.filter((p) => p.direction === "outgoing").length,
      notes: "Logged from this terminal",
    },
    {
      category: "Awaiting drop-off",
      count: parcels.filter((p) => p.status === "pending_dropoff").length,
      notes: "Sender desk",
    },
    {
      category: "In transit",
      count: parcels.filter((p) => p.status === "in_transit").length,
      notes: "On buses",
    },
    {
      category: "Arrived at station",
      count: parcels.filter((p) => p.status === "arrived").length,
      notes: "Receiver desk",
    },
    {
      category: "Ready to collect",
      count: getCollectionQueueParcels(parcels).length,
      notes: "Collection queue",
    },
    {
      category: "Collected",
      count: parcels.filter((p) => p.status === "collected").length,
      notes: "Handed to recipients",
    },
    {
      category: "Overdue (1+ days)",
      count: overdue.length,
      notes: `Est. fees ₵${totalFees}`,
    },
  ];

  return {
    columns: [
      { key: "category", label: "Category" },
      { key: "count", label: "Count" },
      { key: "notes", label: "Notes" },
    ],
    rows,
    summary: [
      { label: "Total parcels", value: parcels.length, highlight: true },
      { label: "Collected", value: parcels.filter((p) => p.status === "collected").length },
      { label: "Overdue cases", value: overdue.length },
      { label: "Est. storage fees", value: `₵${totalFees}` },
    ],
  };
}

function buildOverdueReport(parcels: StaffParcelSummary[]): StaffReportResult {
  const rows = parcels.map((parcel) => {
    const days = getDaysWaiting(parcel);
    return {
      reference: parcel.bookingReference,
      recipient: parcel.recipientName,
      phone: parcel.recipientPhone,
      daysWaiting: days,
      estimatedFee: `₵${days * STORAGE_FEE_PER_DAY_GHS}`,
      arrivedOn: formatReportDate(parcel.updatedAt),
      destination: parcel.destinationStationName,
    };
  });

  const totalFees = parcels.reduce(
    (sum, p) => sum + getDaysWaiting(p) * STORAGE_FEE_PER_DAY_GHS,
    0
  );

  return {
    columns: [
      { key: "reference", label: "Reference" },
      { key: "recipient", label: "Recipient" },
      { key: "phone", label: "Phone" },
      { key: "daysWaiting", label: "Days waiting" },
      { key: "estimatedFee", label: "Est. fee" },
      { key: "arrivedOn", label: "Ready since" },
      { key: "destination", label: "Destination" },
    ],
    rows,
    summary: [
      { label: "Overdue parcels", value: rows.length, highlight: true },
      { label: "Fee per day", value: `₵${STORAGE_FEE_PER_DAY_GHS}` },
      { label: "Total estimated fees", value: `₵${totalFees}` },
    ],
  };
}

function buildPickupRegister(parcels: StaffParcelSummary[]): StaffReportResult {
  const rows = parcels.map((parcel) => ({
    reference: parcel.bookingReference,
    pickupCode: parcel.pickupCode,
    recipient: parcel.recipientName,
    phone: parcel.recipientPhone,
    signatureName: parcel.recipientName,
    collectedAt: formatReportDate(parcel.updatedAt),
    items: parcel.itemCount,
    destination: parcel.destinationStationName,
  }));

  return {
    columns: [
      { key: "reference", label: "Reference" },
      { key: "pickupCode", label: "Pickup code" },
      { key: "recipient", label: "Recipient" },
      { key: "phone", label: "Phone" },
      { key: "signatureName", label: "Signature / name" },
      { key: "collectedAt", label: "Collected at" },
      { key: "items", label: "Items" },
      { key: "destination", label: "Destination" },
    ],
    rows,
    summary: [
      { label: "Pickups recorded", value: rows.length, highlight: true },
      { label: "Total items", value: parcels.reduce((sum, p) => sum + p.itemCount, 0) },
    ],
  };
}

function buildBusHandoverReport(parcels: StaffParcelSummary[]): StaffReportResult {
  const rows = parcels.map((parcel) => {
    const detail = toStaffParcelDetail(parcel);
    return {
      busNumber: detail.busNumber ?? "—",
      reference: parcel.bookingReference,
      direction: parcel.direction === "outgoing" ? "Outgoing" : "Incoming",
      recipient: parcel.recipientName,
      origin: parcel.originStationName,
      destination: parcel.destinationStationName,
      status: TRACK_STATUS_LABELS[parcel.status],
      handoverDate: formatReportDate(parcel.updatedAt),
      items: parcel.itemCount,
    };
  });

  return {
    columns: [
      { key: "busNumber", label: "Bus" },
      { key: "reference", label: "Reference" },
      { key: "direction", label: "Direction" },
      { key: "recipient", label: "Recipient" },
      { key: "origin", label: "Origin" },
      { key: "destination", label: "Destination" },
      { key: "status", label: "Status" },
      { key: "handoverDate", label: "Handover date" },
      { key: "items", label: "Items" },
    ],
    rows,
    summary: [
      { label: "Parcels logged", value: rows.length, highlight: true },
      { label: "Buses involved", value: new Set(rows.map((row) => row.busNumber)).size },
      { label: "Incoming", value: parcels.filter((p) => p.direction === "incoming").length },
      { label: "Outgoing", value: parcels.filter((p) => p.direction === "outgoing").length },
    ],
  };
}

export function buildReportResult(
  allParcels: StaffParcelSummary[],
  filter: StaffReportFilter
): StaffReportResult {
  if (filter.reportType === "daily_summary") {
    const inRange = allParcels.filter((parcel) =>
      isParcelInDateRange(parcel, filter.dateFrom, filter.dateTo)
    );
    return buildDailySummary(inRange);
  }

  const parcels = filterParcelsForReport(allParcels, filter);

  switch (filter.reportType) {
    case "overdue_collection":
      return buildOverdueReport(parcels);
    case "pickup_register":
      return buildPickupRegister(parcels);
    case "bus_handover":
      return buildBusHandoverReport(parcels);
    default:
      return {
        columns: STANDARD_REPORT_COLUMNS,
        rows: parcels.map(parcelToStandardRow),
        summary: [
          { label: "Records found", value: parcels.length, highlight: true },
          { label: "Incoming", value: parcels.filter((p) => p.direction === "incoming").length },
          { label: "Outgoing", value: parcels.filter((p) => p.direction === "outgoing").length },
        ],
      };
  }
}

export function getDefaultReportDateRange() {
  const today = new Date();
  const from = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    dateFrom: from.toISOString().slice(0, 10),
    dateTo: today.toISOString().slice(0, 10),
  };
}

export function getReportTypeConfig(type: StaffReportType) {
  return STAFF_REPORT_TYPES.find((item) => item.id === type)!;
}

export function getReportTypesByCategory(category: ReportCategory) {
  return STAFF_REPORT_TYPES.filter((item) => item.category === category);
}

export function formatReportPeriod(dateFrom: string, dateTo: string) {
  const from = new Date(dateFrom).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const to = new Date(dateTo).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${from} – ${to}`;
}

export type StaffReportMeta = {
  companyName: string;
  companyTagline: string;
  logoSrc: string;
  accentColor: string;
  accentRgb: [number, number, number];
  stationName: string;
  stationCode: string;
  operator: Operator;
  reportTitle: string;
  periodLabel: string;
  generatedBy: string;
  generatedAt: string;
};

export function buildStaffReportMeta(input: {
  stationName: string;
  stationCode: string;
  operator: Operator;
  reportTitle: string;
  periodLabel: string;
  generatedBy: string;
  generatedAt?: string;
}): StaffReportMeta {
  const brand = OPERATOR_REPORT_BRAND[input.operator];
  const theme = getOperatorStaffTheme(input.operator);

  return {
    companyName: brand.companyName,
    companyTagline: brand.companyTagline,
    logoSrc: OPERATOR_LOGOS[input.operator],
    accentColor: theme.accent,
    accentRgb: brand.accentRgb,
    stationName: input.stationName,
    stationCode: input.stationCode,
    operator: input.operator,
    reportTitle: input.reportTitle,
    periodLabel: input.periodLabel,
    generatedBy: input.generatedBy,
    generatedAt: input.generatedAt ?? new Date().toLocaleString("en-GB"),
  };
}
