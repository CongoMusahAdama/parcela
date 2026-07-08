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

export function StaffNavProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [navMessage, setNavMessage] = useState<string | undefined>();
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDelayTimer = useCallback(() => {
    if (delayTimerRef.current) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
  }, []);

  const startNavigation = useCallback(
    (message?: string) => {
      setNavMessage(message);
      clearDelayTimer();
      // Fast navigations never flash the full-page preloader.
      delayTimerRef.current = setTimeout(() => {
        setIsNavigating(true);
        delayTimerRef.current = null;
      }, NAV_OVERLAY_DELAY_MS);
    },
    [clearDelayTimer],
  );

  useEffect(() => {
    clearDelayTimer();
    setIsNavigating(false);
    setNavMessage(undefined);
  }, [pathname, clearDelayTimer]);

  useEffect(() => () => clearDelayTimer(), [clearDelayTimer]);

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
