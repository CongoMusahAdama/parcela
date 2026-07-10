"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SplashGateProvider } from "@/components/brand/SplashGate";
import { SplashScreen } from "@/components/brand/SplashScreen";
import { MobileAppFrame } from "@/components/ui/MobileAppFrame";

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isWebPortal =
    pathname?.startsWith("/staff") ||
    pathname?.startsWith("/lead") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/platform");

  if (isWebPortal) {
    return <>{children}</>;
  }

  return (
    <MobileAppFrame>
      <SplashGateProvider>
        <SplashScreen />
        {children}
      </SplashGateProvider>
    </MobileAppFrame>
  );
}
