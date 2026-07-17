export type PortalWelcomeKind = "staff" | "lead" | "admin";

const PENDING_KEY = "parcela.portalWelcome.pending";
const SEEN_PREFIX = "parcela.portalWelcomeSeen.v1";

function seenKey(portal: PortalWelcomeKind, accountId: string) {
  return `${SEEN_PREFIX}.${portal}.${accountId}`;
}

/** Call after first login or after setting a new password / PIN. */
export function queuePortalWelcome(portal: PortalWelcomeKind, accountId: string) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(PENDING_KEY, `${portal}:${accountId}`);
}

export function hasSeenPortalWelcome(portal: PortalWelcomeKind, accountId: string) {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(seenKey(portal, accountId)) === "1";
}

export function shouldShowPortalWelcome(portal: PortalWelcomeKind, accountId: string) {
  if (hasSeenPortalWelcome(portal, accountId)) return false;
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(PENDING_KEY) === `${portal}:${accountId}`;
}

export function markPortalWelcomeSeen(portal: PortalWelcomeKind, accountId: string) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(seenKey(portal, accountId), "1");
  }
  if (typeof sessionStorage !== "undefined") {
    const pending = sessionStorage.getItem(PENDING_KEY);
    if (pending === `${portal}:${accountId}`) {
      sessionStorage.removeItem(PENDING_KEY);
    }
  }
}

export const PARCELA_SUPPORT_EMAIL = "support@parcela.app";
