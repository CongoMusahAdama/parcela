"use client";

import { useEffect, useRef } from "react";
import { SESSION_IDLE_MS } from "@/lib/session-idle";

const ACTIVITY_THROTTLE_MS = 15_000;
const CHECK_INTERVAL_MS = 60_000;

const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "touchstart",
  "scroll",
  "click",
  "wheel",
] as const;

type UseInactivityLogoutOptions = {
  enabled?: boolean;
  timeoutMs?: number;
  onIdle: () => void | Promise<void>;
};

/** Signs the user out after prolonged inactivity (default 30 minutes). */
export function useInactivityLogout({
  enabled = true,
  timeoutMs = SESSION_IDLE_MS,
  onIdle,
}: UseInactivityLogoutOptions) {
  const lastActivityRef = useRef(Date.now());
  const lastRecordedRef = useRef(0);
  const firedRef = useRef(false);
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;

  useEffect(() => {
    if (!enabled) return;

    lastActivityRef.current = Date.now();
    lastRecordedRef.current = 0;
    firedRef.current = false;

    function fireIdle() {
      if (firedRef.current) return;
      firedRef.current = true;
      void onIdleRef.current();
    }

    function checkIdle() {
      if (Date.now() - lastActivityRef.current >= timeoutMs) {
        fireIdle();
      }
    }

    function recordActivity() {
      if (firedRef.current) return;
      const now = Date.now();
      lastRecordedRef.current = now;
      lastActivityRef.current = now;
    }

    function handleActivity() {
      if (firedRef.current) return;
      const now = Date.now();
      if (now - lastRecordedRef.current < ACTIVITY_THROTTLE_MS) return;
      recordActivity();
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        checkIdle();
      }
    }

    const intervalId = window.setInterval(checkIdle, CHECK_INTERVAL_MS);

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, handleActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, handleActivity);
      }
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [enabled, timeoutMs]);
}
