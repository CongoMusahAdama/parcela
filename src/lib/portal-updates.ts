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
  if (typeof localStorage === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(seenKey(portal, accountId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeSeenIds(portal: PortalUpdateKind, accountId: string, ids: Set<string>) {
  if (typeof localStorage === "undefined") return;
  const trimmed = Array.from(ids).slice(-100);
  localStorage.setItem(seenKey(portal, accountId), JSON.stringify(trimmed));
}

export function getUnreadPortalUpdates(
  portal: PortalUpdateKind,
  accountId: string,
  items: PortalUpdateItem[],
): PortalUpdateItem[] {
  const seen = readSeenIds(portal, accountId);
  return items.filter((item) => !seen.has(item.id));
}

export function markPortalUpdateSeen(
  portal: PortalUpdateKind,
  accountId: string,
  updateId: string,
) {
  const seen = readSeenIds(portal, accountId);
  seen.add(updateId);
  writeSeenIds(portal, accountId, seen);
}

export function portalUpdatesPath(portal: PortalUpdateKind): string {
  if (portal === "admin") return "/admin/platform-updates";
  if (portal === "lead") return "/lead/platform-updates";
  return "/staff/platform-updates";
}
