export type PortalWelcomeKind = "staff" | "lead" | "admin";

/**
 * Bump this when the welcome content itself changes and should be shown again
 * to people who already dismissed an older version.
 */
export const PORTAL_WELCOME_VERSION = "1";

const PENDING_KEY = "parcela.portalWelcome.pending";
const SEEN_PREFIX = `parcela.portalWelcomeSeen.v${PORTAL_WELCOME_VERSION}`;

function seenKey(portal: PortalWelcomeKind, accountId: string) {
  return `${SEEN_PREFIX}.${portal}.${accountId}`;
}

function safeGetLocal(key: string): string | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetLocal(key: string, value: string) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(key, value);
  } catch {
    // Private mode / blocked storage — welcome may reappear this browser session only.
  }
}

function safeRemoveSession(key: string) {
  try {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function safeGetSession(key: string): string | null {
  try {
    if (typeof sessionStorage === "undefined") return null;
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetSession(key: string, value: string) {
  try {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

/** Call after first login or after setting a new password / PIN (only if not seen yet). */
export function queuePortalWelcome(portal: PortalWelcomeKind, accountId: string) {
  if (hasSeenPortalWelcome(portal, accountId)) return;
  safeSetSession(PENDING_KEY, `${portal}:${accountId}`);
}

export function hasSeenPortalWelcome(portal: PortalWelcomeKind, accountId: string) {
  if (!accountId) return true;
  return safeGetLocal(seenKey(portal, accountId)) === "1";
}

/**
 * Show once per account (per welcome version). Pending from login is optional —
 * any first portal visit before dismiss still counts.
 */
export function shouldShowPortalWelcome(portal: PortalWelcomeKind, accountId: string) {
  if (!accountId) return false;
  return !hasSeenPortalWelcome(portal, accountId);
}

export function markPortalWelcomeSeen(portal: PortalWelcomeKind, accountId: string) {
  if (!accountId) return;
  safeSetLocal(seenKey(portal, accountId), "1");
  const pending = safeGetSession(PENDING_KEY);
  if (pending === `${portal}:${accountId}`) {
    safeRemoveSession(PENDING_KEY);
  }
}

export const PARCELA_SUPPORT_EMAIL = "support@parcela.app";
