import { ApiError } from "@/lib/api-client";

/** True when the browser reports no network (best-effort; may be stale). */
export function isBrowserOffline(): boolean {
  if (typeof navigator === "undefined") return false;
  return navigator.onLine === false;
}

/** Network / transport failures that should be queued and retried. */
export function isRetriableNetworkError(error: unknown): boolean {
  if (isBrowserOffline()) return true;
  if (error instanceof ApiError) {
    return error.status === 0 || error.status === 408 || error.status === 502 || error.status === 503 || error.status === 504;
  }
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network request failed") ||
    message.includes("load failed") ||
    message.includes("connection") ||
    message.includes("timed out") ||
    message.includes("timeout")
  );
}

export function getNetworkErrorMessage(error: unknown, fallback = "Connection problem"): string {
  if (isBrowserOffline()) {
    return "You appear to be offline. The action will sync when the connection returns.";
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}
