"use client";

import { useEffect } from "react";
import { unregisterOperatorServiceWorker } from "@/lib/operator-pwa";

/** HQ and platform admin stay online-only — no operator offline service worker. */
export function OnlinePortalGuard() {
  useEffect(() => {
    void unregisterOperatorServiceWorker();
  }, []);

  return null;
}
