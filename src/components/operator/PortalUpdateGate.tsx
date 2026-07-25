"use client";

import { useEffect, useState } from "react";
import { PortalUpdateModal } from "@/components/operator/PortalUpdateModal";
import { apiFetch } from "@/lib/api-client";
import { shouldShowPortalWelcome, type PortalWelcomeKind } from "@/lib/operator-portal-welcome";
import {
  getUnreadPortalUpdates,
  markPortalUpdateSeen,
  portalUpdatesPath,
  type PortalUpdateItem,
  type PortalUpdateKind,
} from "@/lib/portal-updates";

type PortalUpdateGateProps = {
  portal: PortalUpdateKind;
  accountId: string;
};

function welcomePortal(portal: PortalUpdateKind): PortalWelcomeKind {
  return portal;
}

export function PortalUpdateGate({ portal, accountId }: PortalUpdateGateProps) {
  const [queue, setQueue] = useState<PortalUpdateItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;
    let timer: number | undefined;

    async function loadWhenReady() {
      // Let the first-login welcome finish first so popups don’t stack.
      if (shouldShowPortalWelcome(welcomePortal(portal), accountId)) {
        timer = window.setTimeout(() => {
          void loadWhenReady();
        }, 900);
        return;
      }

      try {
        const rows = await apiFetch<PortalUpdateItem[]>(portalUpdatesPath(portal));
        if (cancelled) return;
        // Newest first; only unseen IDs (dismissed updates stay dismissed).
        const unread = getUnreadPortalUpdates(portal, accountId, rows).sort(
          (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
        );
        setQueue(unread);
      } catch {
        if (!cancelled) setQueue([]);
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void loadWhenReady();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [portal, accountId]);

  const current = queue[0] ?? null;
  if (!ready || !current) return null;

  return (
    <PortalUpdateModal
      update={current}
      onDismiss={() => {
        markPortalUpdateSeen(portal, accountId, current.id);
        setQueue((prev) => prev.filter((item) => item.id !== current.id));
      }}
    />
  );
}
