import { isLegacyOperator } from "@/lib/admin-operator";
import { OPERATOR_FILTER_ACTIVE_CLASS } from "@/lib/operators";
import { cn } from "@/lib/utils";

type OperatorFilterProps = {
  value: string | "all";
  onChange: (value: string | "all") => void;
  options: Array<{ code: string; label: string }>;
};

export function OperatorFilter({ value, onChange, options }: OperatorFilterProps) {
  if (options.length === 0) return null;

  return (
    <div>
      <p className="font-body mb-2 text-center text-[11px] text-muted">
        Filter by transport service
      </p>
      <div className="rounded-2xl bg-surface p-1 shadow-[var(--shadow-soft)] ring-1 ring-border/60">
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => onChange("all")}
            className={cn(
              "font-display min-w-[5.5rem] flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200",
              value === "all"
                ? "bg-primary text-white shadow-sm"
                : "text-muted hover:bg-background",
            )}
          >
            All stations
          </button>
          {options.map((opt) => {
            const active = value === opt.code;
            const legacy = isLegacyOperator(opt.code);
            return (
              <button
                key={opt.code}
                type="button"
                onClick={() => onChange(opt.code)}
                className={cn(
                  "font-display min-w-[5.5rem] flex-1 rounded-xl px-2 py-2.5 text-sm font-semibold transition-all duration-200",
                  active && legacy && OPERATOR_FILTER_ACTIVE_CLASS[opt.code as "VIP" | "STC"],
                  active && !legacy && "bg-primary text-white shadow-sm",
                  !active && "text-muted hover:bg-background",
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
