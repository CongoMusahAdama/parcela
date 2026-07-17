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
};

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function OperatorInstallBanner({ className }: OperatorInstallBannerProps) {
  const [visible, setVisible] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

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
