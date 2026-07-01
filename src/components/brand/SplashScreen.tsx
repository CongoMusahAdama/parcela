"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { useSplashGate } from "@/components/brand/SplashGate";
import { BRAND_SPLASH_SRC } from "@/lib/brand";
import { cn } from "@/lib/utils";

const SPLASH_DURATION_MS = 4500;
const FADE_DURATION_MS = 550;

export function SplashScreen() {
  const { markDone } = useSplashGate();
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const fadeTimer = window.setTimeout(
      () => setFading(true),
      SPLASH_DURATION_MS - FADE_DURATION_MS
    );
    const hideTimer = window.setTimeout(() => {
      setVisible(false);
      document.body.style.overflow = "";
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
        "fixed inset-0 z-[100] transition-opacity duration-[450ms] ease-out",
        fading ? "pointer-events-none opacity-0" : "opacity-100"
      )}
      aria-hidden={fading}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND_SPLASH_SRC}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full bg-white object-contain object-center"
      />

      <div className="relative flex h-full w-full flex-col items-center justify-start px-6 pt-[max(2.75rem,env(safe-area-inset-top,0px))]">
        <Logo
          size="lg"
          imageClassName="splash-logo-spin !h-20 sm:!h-24"
          className="[&_span]:-ml-3 [&_span]:text-base sm:[&_span]:text-lg"
        />
      </div>
    </div>
  );
}
