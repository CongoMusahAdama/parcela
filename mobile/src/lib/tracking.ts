import type { ParcelTrackStatus, PreBooking, TrackedParcel } from "@/types/parcel";
import { trackParcelByCodeApi, trackParcelByTokenApi } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { getPreBookings } from "@/lib/booking";
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

export async function lookupParcel(
  query: string,
  options?: { refresh?: boolean },
): Promise<TrackedParcel | undefined> {
  const normalized = normalizeTrackQuery(query);
  if (!normalized) return undefined;

  if (options?.refresh) {
    trackCacheByCode.delete(normalized);
  } else {
    const cached = trackCacheByCode.get(normalized);
    if (cached) return cached;
  }

  try {
    const parcel = await trackParcelByCodeApi(normalized);
    trackCacheByCode.set(normalized, parcel);
    return parcel;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) return undefined;
      if (error.status === 0) return undefined;
    }
  }

  const bookings = await getPreBookings();
  const booking = bookings.find((b) => b.bookingReference === normalized);
  if (booking) return preBookingToTracked(booking);

  const byCode = bookings.find(
    (b) =>
      b.pickupCode === normalized ||
      derivePickupCodeFromReference(b.bookingReference) === normalized
  );
  if (byCode) return preBookingToTracked(byCode);

  return undefined;
}

export async function lookupParcelByToken(
  token: string,
  options?: { refresh?: boolean },
): Promise<TrackedParcel | undefined> {
  const normalized = token.trim().toLowerCase();
  if (!normalized) return undefined;

  if (options?.refresh) {
    trackCacheByToken.delete(normalized);
  } else {
    const cached = trackCacheByToken.get(normalized);
    if (cached) return cached;
  }

  try {
    const parcel = await trackParcelByTokenApi(normalized);
    trackCacheByToken.set(normalized, parcel);
    return parcel;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) return undefined;
      if (error.status === 0) return undefined;
    }
  }

  const bookings = await getPreBookings();
  const fromBooking = bookings.find(
    (b) => deriveTrackingToken(b.bookingReference) === normalized
  );
  if (fromBooking) return preBookingToTracked(fromBooking);

  return undefined;
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
