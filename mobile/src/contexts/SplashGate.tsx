import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type SplashGateContextValue = {
  done: boolean;
  markDone: () => void;
};

const SplashGateContext = createContext<SplashGateContextValue | null>(null);

export function SplashGateProvider({ children }: { children: ReactNode }) {
  const [done, setDone] = useState(false);
  const value = useMemo(
    () => ({
      done,
      markDone: () => setDone(true),
    }),
    [done]
  );

  return <SplashGateContext.Provider value={value}>{children}</SplashGateContext.Provider>;
}

export function useSplashGate() {
  const ctx = useContext(SplashGateContext);
  if (!ctx) {
    throw new Error("useSplashGate must be used within SplashGateProvider");
  }
  return ctx;
}
