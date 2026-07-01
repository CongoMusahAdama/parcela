import { createContext, useContext, type ReactNode } from "react";

const TypographyReadyContext = createContext(false);

export function TypographyReadyProvider({
  ready,
  children,
}: {
  ready: boolean;
  children: ReactNode;
}) {
  return (
    <TypographyReadyContext.Provider value={ready}>{children}</TypographyReadyContext.Provider>
  );
}

export function useTypographyReady() {
  return useContext(TypographyReadyContext);
}
