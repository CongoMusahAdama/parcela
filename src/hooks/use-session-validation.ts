"use client";

import { useEffect, useRef } from "react";

const CHECK_INTERVAL_MS = 60_000;

type UseSessionValidationOptions = {
  enabled?: boolean;
  validate: () => Promise<unknown>;
  onInvalid: () => void | Promise<void>;
};

/** Polls the session endpoint so revoked or expired sessions sign out open tabs quickly. */
export function useSessionValidation({
  enabled = true,
  validate,
  onInvalid,
}: UseSessionValidationOptions) {
  const validateRef = useRef(validate);
  const onInvalidRef = useRef(onInvalid);
  validateRef.current = validate;
  onInvalidRef.current = onInvalid;

  useEffect(() => {
    if (!enabled) return;

    let checking = false;

    async function checkSession() {
      if (checking) return;
      checking = true;
      try {
        await validateRef.current();
      } catch {
        await onInvalidRef.current();
      } finally {
        checking = false;
      }
    }

    const intervalId = window.setInterval(() => void checkSession(), CHECK_INTERVAL_MS);

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        void checkSession();
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [enabled]);
}
