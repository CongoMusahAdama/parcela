import type { Operator } from "@/types/parcel";
import { OPERATOR_LOGOS } from "@/lib/operators";
import { cn } from "@/lib/utils";

type OperatorLogoProps = {
  operator: Operator;
  variant?: "inline" | "watermark";
  className?: string;
};

export function OperatorLogo({ operator, variant = "inline", className }: OperatorLogoProps) {
  const src = OPERATOR_LOGOS[operator];

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
            className
          )}
        />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={operator}
      className={cn("h-9 w-auto max-w-[10rem] object-contain", className)}
    />
  );
}
