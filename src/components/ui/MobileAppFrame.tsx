import type { ReactNode } from "react";

/** Centers the app like a native phone UI on all screen sizes. */
export function MobileAppFrame({ children }: { children: ReactNode }) {
  return (
    <div className="parcela-app-canvas min-h-dvh w-full">
      <div className="parcela-app-frame mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-background">
        {children}
      </div>
    </div>
  );
}
