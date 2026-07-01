import { BRAND_LOGO_SRC, BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

type LogoProps = {
  size?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  className?: string;
  imageClassName?: string;
};

const imageSizes = {
  sm: "h-9 w-auto",
  md: "h-11 w-auto",
  lg: "h-14 w-auto",
  xl: "h-16 w-auto",
};

const textSizes = {
  sm: "text-[11px]",
  md: "text-xs",
  lg: "text-sm",
  xl: "text-base",
};

export function Logo({
  size = "md",
  showWordmark = true,
  className,
  imageClassName,
}: LogoProps) {
  return (
    <div className={cn("inline-flex items-center overflow-visible", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND_LOGO_SRC}
        alt={BRAND_NAME}
        className={cn("relative z-10 shrink-0 object-contain", imageSizes[size], imageClassName)}
      />
      {showWordmark && (
        <span
          className={cn(
            "brand-wordmark relative z-20 -ml-1.5 shrink-0 font-bold uppercase tracking-[0.1em] text-primary",
            textSizes[size]
          )}
        >
          {BRAND_NAME}
        </span>
      )}
    </div>
  );
}
