"use client";

import { useEffect } from "react";
import {
  ensureOperatorManifestLink,
  registerOperatorServiceWorker,
} from "@/lib/operator-pwa";

/** Registers the operator PWA (staff / lead / portal login) — not used on HQ or platform admin. */
export function OperatorPwaSetup() {
  useEffect(() => {
    ensureOperatorManifestLink();
    void registerOperatorServiceWorker();
  }, []);

  return null;
}
