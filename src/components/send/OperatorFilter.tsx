import type { Operator } from "@/types/parcel";
import { SUPPORTED_OPERATORS, OPERATOR_FILTER_ACTIVE_CLASS } from "@/lib/operators";
import { cn } from "@/lib/utils";

type OperatorFilterProps = {
  value: "all" | Operator;
  onChange: (value: "all" | Operator) => void;
};

const options: { value: "all" | Operator; label: string }[] = [
  { value: "all", label: "All stations" },
  ...SUPPORTED_OPERATORS.map((op) => ({ value: op, label: op })),
];

export function OperatorFilter({ value, onChange }: OperatorFilterProps) {
  return (
    <div>
      <p className="font-body mb-2 text-center text-[11px] text-muted">
        VIP and STC stations only
      </p>
      <div className="rounded-2xl bg-surface p-1 shadow-[var(--shadow-soft)] ring-1 ring-border/60">
        <div className="grid grid-cols-3 gap-1">
          {options.map((opt) => {
            const active = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className={cn(
                  "font-display rounded-xl py-2.5 text-sm font-semibold transition-all duration-200",
                  active && opt.value === "all" && "bg-primary text-white shadow-sm",
                  active && opt.value === "VIP" && OPERATOR_FILTER_ACTIVE_CLASS.VIP,
                  active && opt.value === "STC" && OPERATOR_FILTER_ACTIVE_CLASS.STC,
                  !active && "text-muted hover:bg-background"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
