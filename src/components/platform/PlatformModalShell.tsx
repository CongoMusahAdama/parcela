"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { PLATFORM_THEME } from "@/lib/platform-theme";
import { cn } from "@/lib/utils";

type PlatformModalShellProps = {
  onClose: () => void;
  eyebrow: string;
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  maxWidthClass?: string;
  headerExtra?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

export function PlatformModalShell({
  onClose,
  eyebrow,
  title,
  subtitle,
  leading,
  maxWidthClass = "max-w-lg",
  headerExtra,
  children,
  footer,
}: PlatformModalShellProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-sm">
      <div
        className={cn(
          "platform-portal flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl",
          maxWidthClass,
        )}
        style={
          {
            "--platform-orange": PLATFORM_THEME.orange,
            "--platform-orange-dark": PLATFORM_THEME.orangeDark,
            "--platform-orange-muted": PLATFORM_THEME.orangeMuted,
            "--platform-orange-soft": PLATFORM_THEME.orangeSoft,
          } as React.CSSProperties
        }
      >
        <div
          className="relative overflow-hidden px-5 py-5 text-white"
          style={{ background: PLATFORM_THEME.headerGradient }}
        >
          <div
            className="pointer-events-none absolute -right-6 -top-8 size-32 rounded-full bg-white/10 blur-2xl"
            aria-hidden
          />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {leading}
              <div>
                <p className="font-display text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
                  {eyebrow}
                </p>
                <h3 className="font-display mt-0.5 text-lg font-bold tracking-tight sm:text-xl">
                  {title}
                </h3>
                {subtitle ? (
                  <p className="font-body mt-1 text-sm text-white/85">{subtitle}</p>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/20 bg-white/10 p-1.5 text-white/90 transition-colors hover:bg-white/20"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {headerExtra ? (
          <div className="border-b border-stone-100 bg-stone-50/80 px-5 py-4">{headerExtra}</div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto bg-stone-50/40 p-5">{children}</div>

        {footer ? (
          <div className="border-t border-stone-100 bg-white px-5 py-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
