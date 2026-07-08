"use client";

import { forwardRef } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StaffAuthSelectProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: LucideIcon;
  options: Array<{ value: string; label: string; hint?: string }>;
  placeholder?: string;
  disabled?: boolean;
};

export const StaffAuthSelect = forwardRef<HTMLSelectElement, StaffAuthSelectProps>(
  function StaffAuthSelect(
    { id, label, value, onChange, icon: Icon, options, placeholder, disabled },
    ref,
  ) {
    return (
      <div>
        <label htmlFor={id} className="staff-field-label mb-2 block text-muted">
          {label}
        </label>
        <div className="relative">
          <Icon className="pointer-events-none absolute left-4 top-1/2 z-10 size-[18px] -translate-y-1/2 text-[#0D9488]" />
          <select
            ref={ref}
            id={id}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              "staff-field-input font-body w-full min-h-[52px] appearance-none rounded-xl border border-border bg-surface py-3 pl-12 pr-10 text-base text-foreground shadow-sm outline-none transition-all focus:border-[#0D9488] focus:shadow-[0_0_0_3px_rgb(13_148_136/0.15)] disabled:opacity-60",
            )}
          >
            {placeholder ? (
              <option value="" disabled>
                {placeholder}
              </option>
            ) : null}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.hint ? `${option.label} — ${option.hint}` : option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  },
);
