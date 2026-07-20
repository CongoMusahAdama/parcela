"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { useSplashGate } from "@/components/brand/SplashGate";
import { BRAND_SPLASH_SRC } from "@/lib/brand";
import { cn } from "@/lib/utils";

const SPLASH_DURATION_MS = 4500;
const FADE_DURATION_MS = 550;
const SPLASH_SESSION_KEY = "parcela_splash_seen";

export function SplashScreen() {
  const { markDone } = useSplashGate();
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SPLASH_SESSION_KEY) === "1") {
        setVisible(false);
        markDone();
        return;
      }
    } catch {
      // sessionStorage unavailable — show splash normally
    }

    document.body.style.overflow = "hidden";

    const fadeTimer = window.setTimeout(
      () => setFading(true),
      SPLASH_DURATION_MS - FADE_DURATION_MS,
    );
    const hideTimer = window.setTimeout(() => {
      setVisible(false);
      document.body.style.overflow = "";
      try {
        sessionStorage.setItem(SPLASH_SESSION_KEY, "1");
      } catch {
        // ignore
      }
      markDone();
    }, SPLASH_DURATION_MS);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
      document.body.style.overflow = "";
    };
  }, [markDone]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-[100] overflow-hidden bg-white transition-opacity duration-[450ms] ease-out",
        fading ? "pointer-events-none opacity-0" : "opacity-100",
      )}
      aria-hidden={fading}
      role="status"
      aria-label="Loading Parcela"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND_SPLASH_SRC}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full bg-white object-contain object-center"
      />

      <div className="relative flex h-full w-full flex-col">
        <div className="flex flex-1 flex-col items-center justify-start px-6 pt-[max(2.75rem,env(safe-area-inset-top,0px))]">
          <Logo
            size="lg"
            imageClassName="splash-logo-spin !h-20 sm:!h-24"
            className="[&_span]:-ml-3 [&_span]:text-base sm:[&_span]:text-lg"
          />
        </div>

        <div className="flex flex-col items-center gap-3 px-10 pb-[max(2.5rem,env(safe-area-inset-bottom,0px)+1rem)]">
          <div className="flex items-center gap-2.5">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-foreground">
              Getting ready
            </p>
            <span className="splash-loading-dots flex items-center gap-1.5" aria-hidden>
              <span className="size-1.5 rounded-full bg-primary" />
              <span className="size-1.5 rounded-full bg-primary" />
              <span className="size-1.5 rounded-full bg-primary" />
            </span>
          </div>

          <div className="splash-progress-track h-[3px] w-full max-w-[220px] overflow-hidden rounded-full bg-primary/15">
            <div className="splash-progress-fill h-full rounded-full bg-primary" />
          </div>

          <p className="font-body text-center text-xs tracking-wide text-muted">
            Please wait a moment
          </p>
        </div>
      </div>
    </div>
  );
}
