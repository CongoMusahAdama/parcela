import type { PreBooking } from "@/types/parcel";
import { normalizePreBooking } from "@/lib/bookingItems";
import { createBookingApi, getBookingApi } from "@/lib/api";
import type { CreateBookingPayload } from "@/lib/api-types";
import { getStationById } from "@/lib/stations";
import type { Operator } from "@/types/parcel";

const BOOKING_STORAGE_KEY = "parcela_prebookings";

export function generateBookingReference(): string {
  const segment = () =>
    Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PCL-${segment()}-${segment()}`;
}

export async function submitBooking(payload: CreateBookingPayload): Promise<PreBooking> {
  const booking = await createBookingApi(payload);
  cachePreBooking(booking);
  return booking;
}

export function cachePreBooking(booking: PreBooking): void {
  if (typeof window === "undefined") return;
  const existing = getPreBookings();
  existing.unshift(booking);
  sessionStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(existing));
}

export function savePreBooking(booking: PreBooking): void {
  cachePreBooking(booking);
}

export function getPreBookings(): PreBooking[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(BOOKING_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>[]) : [];
    return parsed.map((b) => normalizePreBooking(b));
  } catch {
    return [];
  }
}

export function getPreBookingByReference(ref: string): PreBooking | undefined {
  return getPreBookings().find((b) => b.bookingReference === ref);
}

/** Load booking from API (MongoDB), with local session cache as fallback */
export async function fetchPreBookingByReference(
  ref: string
): Promise<PreBooking | undefined> {
  try {
    const booking = await getBookingApi(ref);
    cachePreBooking(booking);
    return booking;
  } catch {
    return getPreBookingByReference(ref);
  }
}

export function resolveBookingOperator(booking: PreBooking): string {
  if (booking.operator) return booking.operator;
  return getStationById(booking.stationId)?.operator ?? "VIP";
}

export function resolveDestinationOperator(booking: PreBooking): string | undefined {
  if (booking.destinationOperator) return booking.destinationOperator;
  if (booking.destinationStationId) {
    return getStationById(booking.destinationStationId)?.operator;
  }
  return undefined;
}
