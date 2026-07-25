/**
 * Public sender/track web origin for QR codes and shareable links.
 * Prefer NEXT_PUBLIC_WEB_URL (same value as backend PUBLIC_WEB_URL in prod).
 */
export function getPublicWebBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_WEB_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/$/, "");
  }
  return "http://localhost:3001";
}

export function buildStationBookingUrl(stationId: string): string {
  const id = stationId.trim();
  return `${getPublicWebBaseUrl()}/send/book?station=${encodeURIComponent(id)}`;
}
