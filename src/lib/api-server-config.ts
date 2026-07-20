/** Transport service name / operator code used on staff & lead auth (not an API URL). */

const NAME_KEY = "parcela.transportServerName";
const READY_KEY = "parcela.serverConfigured";
/** Legacy key from when this was an API base URL — migrate name then clear. */
const LEGACY_URL_KEY = "parcela.apiBaseUrl";

const DEFAULT_API_URL = "/api";

export function getDefaultApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;
  return url.replace(/\/$/, "");
}

/** Always the app API — transport "server" is a name, not a host. */
export function resolveApiBaseUrl(): string {
  migrateLegacyApiUrlToTransportName();
  return getDefaultApiBaseUrl();
}

export function normalizeTransportName(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/^HTTPS?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/[^A-Z0-9_-]/g, "");
}

export function isValidTransportName(name: string): boolean {
  return /^[A-Z0-9][A-Z0-9_-]{0,31}$/.test(name);
}

/**
 * If the user previously saved something like `https://MMT` as a base URL,
 * keep the name and drop the broken host override.
 */
function migrateLegacyApiUrlToTransportName(): void {
  if (typeof window === "undefined") return;
  try {
    const legacy = window.localStorage.getItem(LEGACY_URL_KEY)?.trim();
    if (!legacy) return;

    const existing = window.localStorage.getItem(NAME_KEY)?.trim();
    if (!existing) {
      const extracted = normalizeTransportName(legacy);
      if (isValidTransportName(extracted)) {
        window.localStorage.setItem(NAME_KEY, extracted);
        window.localStorage.setItem(READY_KEY, "1");
      }
    }

    window.localStorage.removeItem(LEGACY_URL_KEY);
  } catch {
    // ignore
  }
}

export function getStoredTransportName(): string | null {
  if (typeof window === "undefined") return null;
  try {
    migrateLegacyApiUrlToTransportName();
    const raw = window.localStorage.getItem(NAME_KEY)?.trim();
    return raw ? raw.toUpperCase() : null;
  } catch {
    return null;
  }
}

export function setStoredTransportName(name: string): void {
  const cleaned = normalizeTransportName(name);
  if (!cleaned || !isValidTransportName(cleaned)) {
    clearStoredTransportName();
    return;
  }
  window.localStorage.setItem(NAME_KEY, cleaned);
  markServerConfigured();
}

export function clearStoredTransportName(): void {
  try {
    window.localStorage.removeItem(NAME_KEY);
    window.localStorage.removeItem(READY_KEY);
  } catch {
    // ignore
  }
}

/** True only when a transport name is saved (logo can load from that name). */
export function isServerConfigured(): boolean {
  return Boolean(getStoredTransportName());
}

export function markServerConfigured(): void {
  try {
    window.localStorage.setItem(READY_KEY, "1");
  } catch {
    // ignore
  }
}

/** @deprecated kept for older imports — use getStoredTransportName */
export function getStoredApiBaseUrl(): string | null {
  return getStoredTransportName();
}

/** @deprecated */
export function clearInvalidStoredApiBaseUrl(): boolean {
  migrateLegacyApiUrlToTransportName();
  return false;
}
