"use client";

import { forwardRef } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StaffAuthFieldBaseProps = {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  icon: LucideIcon;
  autoComplete?: string;
  trailing?: React.ReactNode;
  variant?: "default" | "onAccent";
  readOnly?: boolean;
};

type StaffAuthFieldControlledProps = StaffAuthFieldBaseProps & {
  value: string;
  onChange: (value: string) => void;
  defaultValue?: never;
};

type StaffAuthFieldUncontrolledProps = StaffAuthFieldBaseProps & {
  defaultValue?: string;
  value?: never;
  onChange?: never;
};

export type StaffAuthFieldProps = StaffAuthFieldControlledProps | StaffAuthFieldUncontrolledProps;

export const StaffAuthField = forwardRef<HTMLInputElement, StaffAuthFieldProps>(
  function StaffAuthField(
    {
      id,
      label,
      type = "text",
      value,
      defaultValue,
      onChange,
      placeholder,
      icon: Icon,
      autoComplete,
      trailing,
      variant = "default",
      readOnly = false,
    },
    ref
  ) {
    const isControlled = value !== undefined;
    const onAccent = variant === "onAccent";

    return (
      <div>
        <label
          htmlFor={id}
          className={cn("staff-field-label mb-2 block", onAccent ? "text-white/90" : "text-muted")}
        >
          {label}
        </label>
        <div className="relative">
          <Icon
            className={cn(
              "pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2",
              onAccent ? "text-[#0D9488]" : "text-[#0D9488]",
            )}
          />
          <input
            ref={ref}
            id={id}
            type={type}
            readOnly={readOnly}
            {...(isControlled
              ? { value, onChange: (e) => onChange?.(e.target.value) }
              : { defaultValue: defaultValue ?? "" })}
            placeholder={placeholder}
            autoComplete={autoComplete}
            className={cn(
              "staff-field-input font-body w-full min-h-[52px] rounded-xl border py-3 pl-12 text-base shadow-sm outline-none transition-all placeholder:font-body focus:shadow-[0_0_0_3px_rgb(13_148_136/0.15)]",
              onAccent
                ? "border-white/25 bg-white text-foreground placeholder:text-muted/60 focus:border-white focus:shadow-[0_0_0_3px_rgb(255_255_255/0.2)]"
                : "border-border bg-surface text-foreground placeholder:text-muted/60 focus:border-[#0D9488]",
              trailing ? "pr-16" : "pr-4",
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
