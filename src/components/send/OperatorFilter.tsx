import { isLegacyOperator } from "@/lib/admin-operator";
import { OPERATOR_FILTER_ACTIVE_CLASS, operatorAccentColor } from "@/lib/operators";
import { cn } from "@/lib/utils";

type OperatorFilterProps = {
  value: string | "all";
  onChange: (value: string | "all") => void;
  options: Array<{ code: string; label: string }>;
};

function FilterChip({
  active,
  onClick,
  children,
  accentColor,
  legacyClass,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  accentColor?: string;
  legacyClass?: string;
}) {
  const lightAccent = accentColor ? isLightHex(accentColor) : false;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "font-display shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all duration-200 sm:text-sm",
        active && legacyClass,
        active && !legacyClass && !lightAccent && "border-transparent text-white shadow-sm",
        active && !legacyClass && lightAccent && "border-transparent shadow-sm",
        !active && "border-border bg-surface text-muted hover:border-primary/30 hover:text-foreground",
      )}
      style={
        active && !legacyClass && accentColor
          ? {
              backgroundColor: accentColor,
              borderColor: accentColor,
              color: lightAccent ? "#0f172a" : "#ffffff",
            }
          : undefined
      }
    >
      {children}
    </button>
  );
}

function isLightHex(hex: string): boolean {
  const raw = hex.replace("#", "").trim();
  if (raw.length !== 3 && raw.length !== 6) return false;
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return false;
  // Relative luminance threshold — light peach/cream brands need dark text
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.65;
}

export function OperatorFilter({ value, onChange, options }: OperatorFilterProps) {
  if (options.length === 0) return null;

  return (
    <div>
      <p className="font-body mb-2 text-[11px] text-muted">Filter by transport service</p>
      <div className="-mx-1 overflow-x-auto overscroll-x-contain px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max min-w-full gap-2 pr-1">
          <FilterChip active={value === "all"} onClick={() => onChange("all")}>
            All stations
          </FilterChip>
          {options.map((opt) => {
            const active = value === opt.code;
            const legacy = isLegacyOperator(opt.code);
            const legacyClass =
              active && legacy ? OPERATOR_FILTER_ACTIVE_CLASS[opt.code as "VIP" | "STC"] : undefined;
            const accent = operatorAccentColor(opt.code);

            return (
              <FilterChip
                key={opt.code}
                active={active}
                onClick={() => onChange(opt.code)}
                accentColor={accent}
                legacyClass={legacyClass}
              >
                <span className="whitespace-nowrap">{opt.label}</span>
              </FilterChip>
            );
          })}
        </div>
      </div>
    </div>
  );
}
