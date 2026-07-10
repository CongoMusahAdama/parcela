"use client";

import { forwardRef } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type PlatformAuthFieldProps = {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon: LucideIcon;
  autoComplete?: string;
  trailing?: React.ReactNode;
};

export const PlatformAuthField = forwardRef<HTMLInputElement, PlatformAuthFieldProps>(
  function PlatformAuthField(
    {
      id,
      label,
      type = "text",
      value,
      onChange,
      placeholder,
      icon: Icon,
      autoComplete,
      trailing,
    },
    ref,
  ) {
    return (
      <div>
        <label
          htmlFor={id}
          className="font-display mb-2 block text-[11px] font-semibold uppercase tracking-wider text-stone-500"
        >
          {label}
        </label>
        <div className="relative">
          <Icon
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400"
            strokeWidth={2.25}
          />
          <input
            ref={ref}
            id={id}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            autoComplete={autoComplete}
            className={cn(
              "font-body w-full rounded-xl border border-stone-200 bg-white py-3 pl-11 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400",
              "focus:border-[var(--platform-orange)] focus:ring-2 focus:ring-[var(--platform-orange-muted)]",
              trailing ? "pr-12" : "pr-3.5",
            )}
          />
          {trailing ? (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</div>
          ) : null}
        </div>
      </div>
    );
  },
);
