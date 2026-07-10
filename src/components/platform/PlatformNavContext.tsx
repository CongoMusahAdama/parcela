"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type PlatformNavContextValue = {
  activePath: string;
  setPendingPath: (href: string) => void;
};

const PlatformNavContext = createContext<PlatformNavContextValue | null>(null);

export function PlatformNavProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pendingPath, setPendingPathState] = useState<string | null>(null);

  useEffect(() => {
    setPendingPathState(null);
  }, [pathname]);

  function setPendingPath(href: string) {
    setPendingPathState(href);
  }

  return (
    <PlatformNavContext.Provider
      value={{ activePath: pendingPath ?? pathname, setPendingPath }}
    >
      {children}
    </PlatformNavContext.Provider>
  );
}

export function usePlatformNav() {
  const context = useContext(PlatformNavContext);
  if (!context) {
    throw new Error("usePlatformNav must be used within PlatformNavProvider");
  }
  return context;
}
