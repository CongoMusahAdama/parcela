import { GHANA_STATIONS } from "../../data/ghana-stations";
import type { ParcelType } from "@/types/parcel";

export type ParcelTagItem = {
  parcelType: ParcelType;
  description: string;
};

export type ParcelTagFields = {
  operator: string;
  receiptNumber: string;
  bookingReference: string;
  pickupCode: string;
  dateTime: string;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  originRouteLabel: string;
  destinationRouteLabel: string;
  originStationName: string;
  destinationStationName: string;
  contents: string;
  descriptionCode: string;
  itemCount: number;
  busNumber?: string;
  driverName?: string;
  driverPhone?: string;
  statusLabel: string;
};

const PARCEL_TYPE_CODES: Record<ParcelType, string> = {
  document: "DOC",
  envelope: "ENV",
  box: "BOX",
  other: "M/P",
};

export function resolveStationCode(stationId: string): string {
  const station = GHANA_STATIONS.find((s) => s.id === stationId);
  return station?.code ?? "PCL";
}

export function resolveStationCity(stationId: string, fallbackName: string): string {
  const station = GHANA_STATIONS.find((s) => s.id === stationId);
  return (station?.city ?? fallbackName).toUpperCase();
}

export function stationTagCode(stationCode: string): string {
  const part = stationCode.includes("-") ? stationCode.split("-").pop()! : stationCode;
  return part.slice(0, 3).toUpperCase();
}

export function buildTagReceiptNumber(
  originStationCode: string,
  destinationStationCode: string,
  at: Date,
  bookingReference: string
): string {
  const origin = stationTagCode(originStationCode);
  const dest = stationTagCode(destinationStationCode);
  const yy = String(at.getFullYear()).slice(-2);
  const mm = String(at.getMonth() + 1).padStart(2, "0");
  const dd = String(at.getDate()).padStart(2, "0");
  const suffix = bookingReference.replace(/[^A-Z0-9]/gi, "").slice(-5).toUpperCase().padStart(5, "0");
  return `${origin}/${dest}/${yy}${mm}${dd}${suffix}`;
}

export function formatStcDateTime(iso: string | Date): string {
  try {
    const d = typeof iso === "string" ? new Date(iso) : iso;
    const date = d
      .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      .replace(/ /g, "-");
    const time = d
      .toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true })
      .toLowerCase()
      .replace(" ", "");
    return `${date} ${time}`;
  } catch {
    return String(iso);
  }
}

export function parcelTypeToCode(type: ParcelType): string {
  return PARCEL_TYPE_CODES[type];
}

export function buildDescriptionCode(items: ParcelTagItem[]): string {
  const codes = [...new Set(items.map((item) => parcelTypeToCode(item.parcelType)))];
  return codes.length === 1 ? codes[0]! : codes.join("+");
}

export function buildContentsSummary(items: ParcelTagItem[], maxLength = 72): string {
  const text = items
    .map((item) => item.description.trim())
    .filter(Boolean)
    .join(", ");
  if (!text) return "Parcel";
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

export function buildParcelTagFields(input: {
  operator: string;
  bookingReference: string;
  pickupCode: string;
  loggedAt: string | Date;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  originStationId: string;
  destinationStationId: string;
  originStationName: string;
  destinationStationName: string;
  originStationCode?: string;
  destinationStationCode?: string;
  items: ParcelTagItem[];
  busNumber?: string;
  driverName?: string;
  driverPhone?: string;
  statusLabel: string;
}): ParcelTagFields {
  const at = typeof input.loggedAt === "string" ? new Date(input.loggedAt) : input.loggedAt;
  const originCode = input.originStationCode ?? resolveStationCode(input.originStationId);
  const destCode =
    input.destinationStationCode ?? resolveStationCode(input.destinationStationId);

  return {
    operator: input.operator,
    receiptNumber: buildTagReceiptNumber(originCode, destCode, at, input.bookingReference),
    bookingReference: input.bookingReference,
    pickupCode: input.pickupCode,
    dateTime: formatStcDateTime(at),
    senderName: input.senderName,
    senderPhone: input.senderPhone,
    recipientName: input.recipientName,
    recipientPhone: input.recipientPhone,
    originRouteLabel: resolveStationCity(input.originStationId, input.originStationName),
    destinationRouteLabel: resolveStationCity(
      input.destinationStationId,
      input.destinationStationName
    ),
    originStationName: input.originStationName,
    destinationStationName: input.destinationStationName,
    contents: buildContentsSummary(input.items),
    descriptionCode: buildDescriptionCode(input.items),
    itemCount: input.items.length,
    busNumber: input.busNumber,
    driverName: input.driverName,
    driverPhone: input.driverPhone,
    statusLabel: input.statusLabel,
  };
}
