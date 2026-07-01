import { createContext, useContext, type ReactNode } from "react";

const SplashDoneContext = createContext(false);

export function useSplashDone() {
  return useContext(SplashDoneContext);
}

export function SplashDoneProvider({
  splashDone,
  children,
}: {
  splashDone: boolean;
  children: ReactNode;
}) {
  return (
    <SplashDoneContext.Provider value={splashDone}>{children}</SplashDoneContext.Provider>
  );
}
