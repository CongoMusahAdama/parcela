import type { BookingItem, ParcelType, PreBooking } from "@/types/parcel";

export function generateBookingItemId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function createBookingItem(
  partial: Omit<BookingItem, "id"> & { id?: string }
): BookingItem {
  return {
    id: partial.id ?? generateBookingItemId(),
    parcelType: partial.parcelType,
    description: partial.description,
    fragile: partial.fragile,
  };
}

/** Migrate legacy single-parcel bookings to the items array shape. */
export function normalizePreBooking(raw: Record<string, unknown>): PreBooking {
  const booking = raw as PreBooking & {
    parcelType?: ParcelType;
    description?: string;
    fragile?: boolean;
    pickupCode?: string;
    items?: BookingItem[];
  };

  if (Array.isArray(booking.items) && booking.items.length > 0) {
    return {
      ...booking,
      items: booking.items.map((item) =>
        createBookingItem({
          id: item.id,
          parcelType: item.parcelType,
          description: item.description,
          fragile: item.fragile,
        })
      ),
      pickupCode:
        booking.pickupCode ??
        derivePickupCodeFromReference(booking.bookingReference),
    };
  }

  const legacyType = booking.parcelType ?? "box";
  const legacyDesc = booking.description ?? "Parcel";
  const legacyFragile = booking.fragile ?? false;

  return {
    ...booking,
    items: [
      createBookingItem({
        parcelType: legacyType,
        description: legacyDesc,
        fragile: legacyFragile,
      }),
    ],
    pickupCode:
      booking.pickupCode ??
      derivePickupCodeFromReference(booking.bookingReference),
  };
}

export function derivePickupCodeFromReference(bookingReference: string): string {
  const compact = bookingReference.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  const segment = compact.slice(-4).padStart(4, "0");
  return `PKP-${segment}`;
}

const PARCEL_TYPE_LABELS: Record<ParcelType, string> = {
  envelope: "Envelope",
  document: "Documents",
  box: "Box",
  other: "Other",
};

export function parcelTypeLabel(type: ParcelType): string {
  return PARCEL_TYPE_LABELS[type] ?? type;
}

export function formatItemLabel(item: BookingItem, index: number): string {
  const type = parcelTypeLabel(item.parcelType);
  const fragile = item.fragile ? " · Fragile" : "";
  return `${index + 1}. ${type} — ${item.description}${fragile}`;
}

export function formatItemsSummary(items: BookingItem[]): string {
  if (items.length === 0) return "No items";
  if (items.length === 1) {
    const item = items[0];
    return `${parcelTypeLabel(item.parcelType)}${item.fragile ? " · Fragile" : ""}`;
  }
  const types = items.map((i) => parcelTypeLabel(i.parcelType));
  return `${items.length} items · ${types.join(", ")}`;
}

export function bookingHasFragileItem(items: BookingItem[]): boolean {
  return items.some((i) => i.fragile);
}
