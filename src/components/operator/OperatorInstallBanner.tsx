"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import {
  dismissOperatorInstallPrompt,
  isOperatorPwaInstalled,
  wasOperatorInstallDismissed,
} from "@/lib/operator-pwa";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type OperatorInstallBannerProps = {
  className?: string;
  /** login = above sign-in card; portal = top-right after sign-in */
  placement?: "login" | "portal";
};

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function OperatorInstallBanner({
  className,
  placement = "portal",
}: OperatorInstallBannerProps) {
  const [visible, setVisible] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);
  const isLogin = placement === "login";

  useEffect(() => {
    if (isOperatorPwaInstalled() || wasOperatorInstallDismissed()) return;

    const handleBeforeInstall = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setInstallEvent(event);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  if (!visible || isOperatorPwaInstalled() || !installEvent) return null;

  async function handleInstall() {
    if (!installEvent) return;
    setInstalling(true);
    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === "accepted") {
        setVisible(false);
      }
    } finally {
      setInstalling(false);
    }
  }

  function handleDismiss() {
    dismissOperatorInstallPrompt();
    setVisible(false);
  }

  if (isLogin) {
    return (
      <div
        className={cn("w-full animate-fade-up", className)}
        role="region"
        aria-label="Install Parcela Counter"
      >
        <div className="flex flex-col gap-2 rounded-xl border border-[#0D9488]/25 bg-white px-3 py-3 shadow-sm ring-1 ring-[#0D9488]/10 sm:flex-row sm:items-center sm:gap-3 sm:px-4">
          <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:items-center">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#0D9488] text-white">
              <Download className="size-4" strokeWidth={2.25} />
            </span>
            <div className="min-w-0">
              <p className="font-display text-sm font-bold text-foreground">Install Parcela Counter</p>
              <p className="font-body text-xs text-muted">
                Pin to your taskbar — full screen, works offline.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:pl-2">
            <button
              type="button"
              onClick={() => void handleInstall()}
              disabled={installing}
              className="font-display flex-1 rounded-lg bg-[#0D9488] px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-white disabled:opacity-60 sm:flex-none"
            >
              {installing ? "Installing…" : "Install"}
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-lg p-1.5 text-muted hover:bg-slate-100 hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "pointer-events-none fixed right-4 top-4 z-50 sm:right-5 sm:top-5",
        className,
      )}
      role="region"
      aria-label="Install Parcela Counter"
    >
      <div className="pointer-events-auto animate-fade-up overflow-hidden rounded-xl border border-border/80 bg-white shadow-lg ring-1 ring-black/5">
        <div className="flex max-w-[min(calc(100vw-2rem),18rem)] items-center gap-2 px-3 py-2.5">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white"
            style={{ background: "var(--staff-accent, #0d9488)" }}
          >
            <Download className="size-3.5" strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-xs font-bold text-foreground">Install counter app</p>
            <p className="font-body truncate text-[10px] text-muted">Full screen · works offline</p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="shrink-0 rounded-md p-1 text-muted hover:bg-slate-100 hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="size-3.5" />
          </button>
        </div>
        <div className="border-t border-border px-3 py-2">
          <button
            type="button"
            onClick={() => void handleInstall()}
            disabled={installing}
            className="font-display w-full rounded-lg py-1.5 text-[10px] font-bold uppercase tracking-wide text-white disabled:opacity-60"
            style={{ background: "var(--staff-accent, #0d9488)" }}
          >
            {installing ? "Installing…" : "Install now"}
          </button>
        </div>
      </div>
    </div>
  );
}
