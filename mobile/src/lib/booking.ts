import AsyncStorage from "@react-native-async-storage/async-storage";
import { normalizePreBooking } from "@/lib/bookingItems";
import { createBookingApi, getBookingApi, type CreateBookingPayload } from "@/lib/api";
import { ApiError, checkApiHealth } from "@/lib/api-client";
import { getStationById } from "@/lib/stations";
import type { Operator, PreBooking } from "@/types/parcel";

const BOOKING_STORAGE_KEY = "parcela_prebookings";

export function generateBookingReference(): string {
  const segment = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PCL-${segment()}-${segment()}`;
}

export async function submitBooking(payload: CreateBookingPayload): Promise<PreBooking> {
  const apiOk = await checkApiHealth();
  if (!apiOk) {
    throw new ApiError(
      "Cannot reach the Parcela server. Bookings made now would not appear on staff dashboards. " +
        "Connect your phone to the same Wi‑Fi as your computer and allow port 3002 through Windows Firewall.",
      0,
    );
  }

  const booking = await createBookingApi(payload);

  try {
    const verified = await getBookingApi(booking.bookingReference);
    await cachePreBooking(verified);
    return verified;
  } catch {
    throw new ApiError(
      `Booking ${booking.bookingReference} was not saved on the server. Staff will not see it — check your network and try again.`,
      500,
    );
  }
}

export async function cachePreBooking(booking: PreBooking): Promise<void> {
  const existing = await getPreBookings();
  existing.unshift(booking);
  await AsyncStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(existing));
}

/** @deprecated Use submitBooking — kept for offline cache writes */
export async function savePreBooking(booking: PreBooking): Promise<void> {
  await cachePreBooking(booking);
}

export async function getPreBookings(): Promise<PreBooking[]> {
  try {
    const raw = await AsyncStorage.getItem(BOOKING_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>[]) : [];
    return parsed.map((b) => normalizePreBooking(b));
  } catch {
    return [];
  }
}

export async function getPreBookingByReference(ref: string): Promise<PreBooking | undefined> {
  const bookings = await getPreBookings();
  return bookings.find((b) => b.bookingReference === ref);
}

/** Load booking from API (MongoDB), with local cache as fallback */
export async function fetchPreBookingByReference(
  ref: string
): Promise<PreBooking | undefined> {
  try {
    const booking = await getBookingApi(ref);
    await cachePreBooking(booking);
    return booking;
  } catch {
    return getPreBookingByReference(ref);
  }
}

export function resolveBookingOperator(booking: PreBooking): Operator {
  if (booking.operator) return booking.operator;
  return getStationById(booking.stationId)?.operator ?? "VIP";
}

export function resolveDestinationOperator(booking: PreBooking): Operator | undefined {
  if (booking.destinationOperator) return booking.destinationOperator;
  if (booking.destinationStationId) {
    return getStationById(booking.destinationStationId)?.operator;
  }
  return undefined;
}
