"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { SplashScreen } from "@/components/brand/SplashScreen";

const SplashDoneContext = createContext(false);

export function useSplashDone() {
  return useContext(SplashDoneContext);
}

export function SplashProvider({ children }: { children: ReactNode }) {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <SplashDoneContext.Provider value={splashDone}>
      <SplashScreen onComplete={() => setSplashDone(true)} />
      {children}
    </SplashDoneContext.Provider>
  );
}
