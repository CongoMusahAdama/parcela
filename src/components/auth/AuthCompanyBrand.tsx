import { Logo } from "@/components/brand/Logo";
import { loginBrandLogoSrc, type LoginOperatorBrand } from "@/lib/login-brand";
import { cn } from "@/lib/utils";

type AuthCompanyBrandProps = {
  brand: LoginOperatorBrand | null;
  loading?: boolean;
  variant?: "light" | "dark";
  className?: string;
};

export function AuthCompanyBrand({
  brand,
  loading = false,
  variant = "dark",
  className,
}: AuthCompanyBrandProps) {
  const onDark = variant === "dark";
  const logoSrc = brand ? loginBrandLogoSrc(brand) : null;

  if (brand?.found && logoSrc) {
    return (
      <div className={cn("flex min-w-0 max-w-full items-center gap-3", className)}>
        <div className="flex shrink-0 items-center justify-center rounded-lg bg-white px-2.5 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt={brand.operatorName ?? "Transport company"}
            className="max-h-11 w-auto max-w-[120px] object-contain sm:max-h-12 sm:max-w-[140px]"
          />
        </div>
        <div className="min-w-0">
          <p
            className={cn(
              "font-display truncate text-base font-bold tracking-tight sm:text-lg",
              onDark ? "text-white" : "text-[#0f172a]",
            )}
          >
            {brand.operatorName}
          </p>
          {brand.stationName ? (
            <p
              className={cn(
                "font-body truncate text-xs",
                onDark ? "text-white/75" : "text-[#64748b]",
              )}
            >
              {brand.stationName}
            </p>
          ) : null}
          <p className={cn("font-body text-[10px]", onDark ? "text-white/50" : "text-[#94a3b8]")}>
            Powered by Parcela
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div
          className={cn(
            "size-11 animate-pulse rounded-xl",
            onDark ? "bg-white/20" : "bg-[#e2e8f0]",
          )}
          aria-hidden
        />
        <div className="space-y-2">
          <div
            className={cn("h-3 w-28 animate-pulse rounded", onDark ? "bg-white/20" : "bg-[#e2e8f0]")}
            aria-hidden
          />
          <p className={cn("font-body text-[10px]", onDark ? "text-white/55" : "text-[#94a3b8]")}>
            Looking up your company…
          </p>
        </div>
      </div>
    );
  }

  return (
    <Logo
      size="hero"
      className={cn(
        onDark && "[&_span]:text-white [&_img]:brightness-0 [&_img]:invert",
        className,
      )}
    />
  );
}
