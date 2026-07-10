"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type StaffNavContextValue = {
  isNavigating: boolean;
  navMessage?: string;
  startNavigation: (message?: string) => void;
};

const StaffNavContext = createContext<StaffNavContextValue | null>(null);

/** Only show the heavy overlay if navigation takes longer than this. */
const NAV_OVERLAY_DELAY_MS = 120;
/** Never block the UI longer than this — dev first-compile can be slow. */
const NAV_OVERLAY_MAX_MS = 8000;

export function StaffNavProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [navMessage, setNavMessage] = useState<string | undefined>();
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDelayTimer = useCallback(() => {
    if (delayTimerRef.current) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
  }, []);

  const clearMaxTimer = useCallback(() => {
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
  }, []);

  const stopNavigation = useCallback(() => {
    clearDelayTimer();
    clearMaxTimer();
    setIsNavigating(false);
    setNavMessage(undefined);
  }, [clearDelayTimer, clearMaxTimer]);

  const startNavigation = useCallback(
    (message?: string) => {
      setNavMessage(message);
      clearDelayTimer();
      clearMaxTimer();
      // Fast navigations never flash the full-page preloader.
      delayTimerRef.current = setTimeout(() => {
        setIsNavigating(true);
        delayTimerRef.current = null;
        maxTimerRef.current = setTimeout(() => {
          setIsNavigating(false);
          maxTimerRef.current = null;
        }, NAV_OVERLAY_MAX_MS);
      }, NAV_OVERLAY_DELAY_MS);
    },
    [clearDelayTimer, clearMaxTimer],
  );

  useEffect(() => {
    stopNavigation();
  }, [pathname, stopNavigation]);

  useEffect(
    () => () => {
      clearDelayTimer();
      clearMaxTimer();
    },
    [clearDelayTimer, clearMaxTimer],
  );

  return (
    <StaffNavContext.Provider value={{ isNavigating, navMessage, startNavigation }}>
      {children}
    </StaffNavContext.Provider>
  );
}

export function useStaffNav() {
  const context = useContext(StaffNavContext);
  if (!context) {
    throw new Error("useStaffNav must be used within StaffNavProvider");
  }
  return context;
}
