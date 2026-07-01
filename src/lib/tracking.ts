import type { ParcelTrackStatus, PreBooking, TrackedParcel } from "@/types/parcel";
import { trackParcelByCodeApi, trackParcelByTokenApi } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { getPreBookingByReference } from "@/lib/booking";
import { derivePickupCodeFromReference, normalizePreBooking } from "@/lib/bookingItems";
import { getStationById } from "@/lib/stations";
import { deriveTrackingToken, maskPhone } from "@/lib/tracking-shared";

const trackCacheByCode = new Map<string, TrackedParcel>();
const trackCacheByToken = new Map<string, TrackedParcel>();

function preBookingToTracked(booking: PreBooking): TrackedParcel {
  const destination = getStationById(booking.destinationStationId);
  const normalized = normalizePreBooking(booking as unknown as Record<string, unknown>);

  return {
    pickupCode: normalized.pickupCode,
    bookingReference: normalized.bookingReference,
    trackingToken: deriveTrackingToken(normalized.bookingReference),
    status: "pending_dropoff",
    originStationName: normalized.stationName,
    destinationStationId: normalized.destinationStationId,
    destinationStationName: normalized.destinationStationName,
    destinationStationAddress: destination?.address ?? normalized.destinationStationName,
    destinationStationHours: destination?.hours ?? "See station",
    destinationOperator: destination?.operator ?? booking.destinationOperator,
    recipientName: normalized.recipientName,
    recipientPhoneMasked: maskPhone(normalized.recipientPhone),
    items: normalized.items,
    itemCount: normalized.items.length,
    updatedAt: normalized.createdAt,
  };
}

export function derivePickupCode(bookingReference: string): string {
  return derivePickupCodeFromReference(bookingReference);
}

export function normalizeTrackQuery(query: string): string {
  return query.trim().toUpperCase();
}

function findInBookings(normalized: string): TrackedParcel | undefined {
  const booking = getPreBookingByReference(normalized);
  if (booking) return preBookingToTracked(booking);

  const byDerivedCode = getPreBookingsFromSession().find(
    (b) =>
      b.pickupCode === normalized ||
      derivePickupCodeFromReference(b.bookingReference) === normalized
  );
  if (byDerivedCode) return preBookingToTracked(byDerivedCode);

  return undefined;
}

export async function lookupParcelAsync(query: string): Promise<TrackedParcel | undefined> {
  const normalized = normalizeTrackQuery(query);
  if (!normalized) return undefined;

  const cached = trackCacheByCode.get(normalized);
  if (cached) return cached;

  try {
    const parcel = await trackParcelByCodeApi(normalized);
    trackCacheByCode.set(normalized, parcel);
    return parcel;
  } catch (error) {
    if (error instanceof ApiError) {
      return findInBookings(normalized);
    }
  }

  return findInBookings(normalized);
}

export async function lookupParcelByTokenAsync(token: string): Promise<TrackedParcel | undefined> {
  const normalized = token.trim().toLowerCase();
  if (!normalized) return undefined;

  const cached = trackCacheByToken.get(normalized);
  if (cached) return cached;

  try {
    const parcel = await trackParcelByTokenApi(normalized);
    trackCacheByToken.set(normalized, parcel);
    return parcel;
  } catch {
    return lookupParcelByToken(token);
  }
}

export function lookupParcel(query: string): TrackedParcel | undefined {
  const normalized = normalizeTrackQuery(query);
  if (!normalized) return undefined;

  return findInBookings(normalized);
}

export function lookupParcelByToken(token: string): TrackedParcel | undefined {
  const normalized = token.trim().toLowerCase();
  if (!normalized) return undefined;

  const fromSession = getPreBookingsFromSession().find(
    (b) => deriveTrackingToken(b.bookingReference) === normalized
  );
  if (fromSession) return preBookingToTracked(fromSession);

  return undefined;
}

function getPreBookingsFromSession(): PreBooking[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem("parcela_prebookings");
    const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>[]) : [];
    return parsed.map((b) => normalizePreBooking(b));
  } catch {
    return [];
  }
}

export const TRACK_STATUS_LABELS: Record<ParcelTrackStatus, string> = {
  pending_dropoff: "Awaiting drop-off",
  in_transit: "In transit",
  arrived: "Arrived at station",
  ready_for_collection: "Ready for collection",
  collected: "Collected",
};

export function resolveStationCoords(parcel: TrackedParcel): { lat: number; lng: number } | null {
  if (!parcel.destinationStationId) return null;
  const station = getStationById(parcel.destinationStationId);
  if (!station) return null;
  return { lat: station.lat, lng: station.lng };
}
