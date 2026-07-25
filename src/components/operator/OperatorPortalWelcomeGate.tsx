"use client";

import { useEffect, useState } from "react";
import { OperatorPortalWelcomeModal } from "@/components/operator/OperatorPortalWelcomeModal";
import {
  markPortalWelcomeSeen,
  shouldShowPortalWelcome,
  type PortalWelcomeKind,
} from "@/lib/operator-portal-welcome";

type OperatorPortalWelcomeGateProps = {
  portal: PortalWelcomeKind;
  accountId: string;
  displayName: string;
  subtitle: string;
  operatorLabel?: string;
};

export function OperatorPortalWelcomeGate({
  portal,
  accountId,
  displayName,
  subtitle,
  operatorLabel,
}: OperatorPortalWelcomeGateProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!accountId) return;
    // Only once per account until welcome version is bumped.
    if (shouldShowPortalWelcome(portal, accountId)) {
      setOpen(true);
    }
  }, [portal, accountId]);

  if (!open) return null;

  return (
    <OperatorPortalWelcomeModal
      portal={portal}
      displayName={displayName}
      subtitle={subtitle}
      operatorLabel={operatorLabel}
      onDismiss={() => {
        markPortalWelcomeSeen(portal, accountId);
        setOpen(false);
      }}
    />
  );
}
