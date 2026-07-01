export function generateBookingReference(): string {
  const segment = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PCL-${segment()}-${segment()}`;
}

export function derivePickupCodeFromReference(bookingReference: string): string {
  const compact = bookingReference.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const segment = compact.slice(-4).padStart(4, '0');
  return `PKP-${segment}`;
}

export function deriveTrackingToken(bookingReference: string): string {
  const clean = bookingReference.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return clean.slice(-10).toLowerCase();
}

export function generateBookingItemId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
