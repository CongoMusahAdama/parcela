export type PortalUpdateKind = "staff" | "lead" | "admin";

export type PortalUpdateItem = {
  id: string;
  title: string;
  body: string;
  audience: string;
  sentAt: string;
};

const SEEN_PREFIX = "parcela.portalUpdatesSeen.v1";

function seenKey(portal: PortalUpdateKind, accountId: string) {
  return `${SEEN_PREFIX}.${portal}.${accountId}`;
}

function readSeenIds(portal: PortalUpdateKind, accountId: string): Set<string> {
  if (!accountId) return new Set();
  try {
    if (typeof localStorage === "undefined") return new Set();
    const raw = localStorage.getItem(seenKey(portal, accountId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeSeenIds(portal: PortalUpdateKind, accountId: string, ids: Set<string>) {
  if (!accountId) return;
  try {
    if (typeof localStorage === "undefined") return;
    const trimmed = Array.from(ids).slice(-100);
    localStorage.setItem(seenKey(portal, accountId), JSON.stringify(trimmed));
  } catch {
    // Private mode / blocked storage — update may reappear this browser session only.
  }
}

export function hasSeenPortalUpdate(
  portal: PortalUpdateKind,
  accountId: string,
  updateId: string,
): boolean {
  return readSeenIds(portal, accountId).has(updateId);
}

export function getUnreadPortalUpdates(
  portal: PortalUpdateKind,
  accountId: string,
  items: PortalUpdateItem[],
): PortalUpdateItem[] {
  const seen = readSeenIds(portal, accountId);
  return items.filter((item) => item.id && !seen.has(item.id));
}

export function markPortalUpdateSeen(
  portal: PortalUpdateKind,
  accountId: string,
  updateId: string,
) {
  if (!updateId) return;
  const seen = readSeenIds(portal, accountId);
  seen.add(updateId);
  writeSeenIds(portal, accountId, seen);
}

/** Mark every currently loaded update as seen (e.g. after draining the popup queue). */
export function markPortalUpdatesSeen(
  portal: PortalUpdateKind,
  accountId: string,
  updateIds: string[],
) {
  const seen = readSeenIds(portal, accountId);
  for (const id of updateIds) {
    if (id) seen.add(id);
  }
  writeSeenIds(portal, accountId, seen);
}

export function portalUpdatesPath(portal: PortalUpdateKind): string {
  if (portal === "admin") return "/admin/platform-updates";
  if (portal === "lead") return "/lead/platform-updates";
  return "/staff/platform-updates";
}
