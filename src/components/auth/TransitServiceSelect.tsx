"use client";

import type { Operator } from "@/types/parcel";
import { OperatorLogo } from "@/components/brand/OperatorLogo";
import { SUPPORTED_OPERATORS } from "@/lib/operators";
import { cn } from "@/lib/utils";

type TransitServiceSelectProps = {
  value: Operator;
  onChange: (value: Operator) => void;
  disabled?: boolean;
  variant?: "light" | "onAccent";
};

export function TransitServiceSelect({
  value,
  onChange,
  disabled = false,
  variant = "light",
}: TransitServiceSelectProps) {
  const onAccent = variant === "onAccent";

  return (
    <div>
      <p
        className={cn(
          "font-body mb-2 text-xs font-semibold uppercase tracking-wider",
          onAccent ? "text-white/80" : "text-muted",
        )}
      >
        Transit service
      </p>
      <div
        className={cn(
          "rounded-xl p-1",
          onAccent ? "bg-white/15 ring-1 ring-white/25" : "bg-[#f8fafc] ring-1 ring-border",
        )}
      >
        <div className="grid grid-cols-2 gap-1">
          {SUPPORTED_OPERATORS.map((operator) => {
            const active = value === operator;
            return (
              <button
                key={operator}
                type="button"
                disabled={disabled}
                onClick={() => onChange(operator)}
                className={cn(
                  "font-display flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-60",
                  active &&
                    (onAccent
                      ? "bg-white text-[#0D9488] shadow-sm"
                      : "bg-[#0D9488] text-white shadow-sm"),
                  !active && (onAccent ? "text-white/85 hover:bg-white/10" : "text-muted hover:bg-white"),
                )}
              >
                <OperatorLogo operator={operator} className="h-5 w-auto" />
                {operator}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
