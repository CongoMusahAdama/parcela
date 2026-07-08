"use client";

import { forwardRef } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminAuthFieldProps = {
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

export const AdminAuthField = forwardRef<HTMLInputElement, AdminAuthFieldProps>(
  function AdminAuthField(
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
    ref
  ) {
    return (
      <div>
        <label
          htmlFor={id}
          className="font-display mb-2 block text-[11px] font-semibold uppercase tracking-wider text-white/70"
        >
          {label}
        </label>
        <div className="relative">
          <Icon className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-[#64748b]" />
          <input
            ref={ref}
            id={id}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            autoComplete={autoComplete}
            className={cn(
              "font-body w-full min-h-[52px] rounded-xl border border-white/10 bg-white py-3 pl-12 text-base text-[#0f172a] shadow-sm outline-none transition-all placeholder:text-[#94a3b8] focus:border-white/40 focus:shadow-[0_0_0_3px_rgb(255_255_255/0.12)]",
              trailing ? "pr-16" : "pr-4"
            )}
          />
          {trailing ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">{trailing}</div>
          ) : null}
        </div>
      </div>
    );
  }
);
