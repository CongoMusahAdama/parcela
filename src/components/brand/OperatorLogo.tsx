import { isLegacyOperator } from "@/lib/admin-operator";
import { getOperatorLabel, OPERATOR_LOGOS } from "@/lib/operators";
import type { Operator } from "@/types/parcel";
import { cn } from "@/lib/utils";

type OperatorLogoProps = {
  operator: string;
  variant?: "inline" | "watermark";
  className?: string;
};

export function OperatorLogo({ operator, variant = "inline", className }: OperatorLogoProps) {
  const code = operator.trim().toUpperCase();
  const legacy = isLegacyOperator(code) ? (code as Operator) : null;
  const src = legacy ? OPERATOR_LOGOS[legacy] : null;

  if (!src) {
    const label = getOperatorLabel(code);
    const initials =
      label
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase() ?? "")
        .join("") || code.slice(0, 2);

    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg bg-primary/10 font-display text-xs font-bold uppercase text-primary",
          variant === "watermark" ? "size-24 text-lg opacity-30" : "h-9 min-w-9 px-2",
          className,
        )}
        title={label}
      >
        {initials}
      </div>
    );
  }

  if (variant === "watermark") {
    return (
      <div
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
        aria-hidden
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className={cn(
            "max-h-[52%] w-[min(88%,18rem)] object-contain opacity-[0.28]",
            className,
          )}
        />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={code}
      className={cn("h-9 w-auto max-w-[10rem] object-contain", className)}
    />
  );
}
