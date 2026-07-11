"use client";

import { cn } from "@/lib/utils";
import { OperatorLogo } from "@/components/brand/OperatorLogo";
import { isKnownBrandOperator } from "@/lib/platform-demo";

type PlatformOperatorMarkProps = {
  code: string;
  name?: string;
  brandColor?: string;
  logoDataUrl?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "letter";
};

const SIZE = {
  sm: "size-10 text-xs",
  md: "size-12 text-sm",
  lg: "size-14 text-base",
  xl: "size-20 text-lg",
  letter: "h-28 w-44 min-h-28 min-w-44 text-xl",
} as const;

/** Logo for VIP/STC; initials mark for any other transport. */
export function PlatformOperatorMark({
  code,
  name,
  brandColor = "#fd7e14",
  logoDataUrl,
  className,
  size = "sm",
}: PlatformOperatorMarkProps) {
  if (logoDataUrl) {
    return (
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden rounded-xl border border-stone-200 bg-white p-1.5",
          SIZE[size],
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoDataUrl}
          alt={name ?? code}
          className="h-full w-full object-contain"
        />
      </div>
    );
  }

  if (isKnownBrandOperator(code)) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl border border-stone-200 bg-white p-2",
          SIZE[size],
          className,
        )}
      >
        <OperatorLogo
          operator={code}
          className={cn(
            "w-auto max-w-full object-contain",
            size === "letter" ? "h-16" : size === "xl" ? "h-10" : "h-8",
          )}
        />
      </div>
    );
  }

  const initials = (name ?? code)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || code.slice(0, 2).toUpperCase();

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl font-display font-bold text-white shadow-sm",
        SIZE[size],
        className,
      )}
      style={{ background: brandColor }}
      title={name ?? code}
    >
      {initials}
    </div>
  );
}
