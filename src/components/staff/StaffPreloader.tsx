"use client";

import { Package } from "lucide-react";
import { operatorStaffThemeStyle } from "@/lib/operator-theme";
import type { Operator } from "@/types/parcel";
import { cn } from "@/lib/utils";

type StaffPreloaderProps = {
  message?: string;
  variant?: "page" | "overlay";
  className?: string;
  operator?: Operator;
};

export function StaffPreloader({
  message = "Loading",
  variant = "page",
  className,
  operator,
}: StaffPreloaderProps) {
  const accent = operator ? "var(--staff-accent)" : "#64748b";
  const accentMuted = operator ? "var(--staff-accent-muted)" : "rgb(100 116 139 / 0.15)";

  return (
    <div
      className={cn(
        operator && "staff-operator-themed",
        variant === "overlay"
          ? "absolute inset-0 z-20 flex items-center justify-center bg-[#eef2f6]/92 backdrop-blur-[2px]"
          : "flex min-h-0 flex-1 items-center justify-center px-4 py-16",
        className
      )}
      style={operator ? operatorStaffThemeStyle(operator) : undefined}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div
        className="flex flex-col items-center gap-5 rounded-2xl border px-10 py-8 shadow-lg"
        style={{
          borderColor: "#e2e8f0",
          background: "#ffffff",
          boxShadow: "0 8px 32px -8px rgb(15 23 42 / 0.12)",
        }}
      >
        <div className="relative size-[4.5rem]">
          <div
            className="absolute inset-0 rounded-full border-[3px] opacity-30"
            style={{ borderColor: accent }}
          />
          <div
            className="staff-preloader-spin absolute inset-0 rounded-full border-[3px] border-transparent"
            style={{ borderTopColor: accent }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="size-7" strokeWidth={2.25} style={{ color: accent }} />
          </div>
        </div>

        <div className="text-center">
          <p
            className="text-sm font-bold tracking-tight capitalize"
            style={{ color: "#0f172a", fontFamily: "var(--font-display, ui-sans-serif, sans-serif)" }}
          >
            {message}
          </p>
          <p
            className="mt-1 text-xs"
            style={{ color: "#64748b", fontFamily: "var(--font-body, ui-sans-serif, sans-serif)" }}
          >
            Please wait a moment
          </p>
        </div>

        <div className="h-1 w-44 overflow-hidden rounded-full" style={{ background: accentMuted }}>
          <div className="staff-preloader-bar h-full w-1/3 rounded-full" style={{ background: accent }} />
        </div>
      </div>
    </div>
  );
}
