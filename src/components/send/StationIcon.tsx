import { Bus, BusFront } from "lucide-react";
import type { Operator } from "@/types/parcel";
import { isLegacyOperator } from "@/lib/admin-operator";
import { OPERATOR_ICON_CLASS, operatorAccentColor } from "@/lib/operators";
import { cn } from "@/lib/utils";

type StationIconProps = {
  operator: string;
  className?: string;
};

const icons: Record<Operator, typeof Bus> = {
  VIP: Bus,
  STC: BusFront,
};

export function StationIcon({ operator, className }: StationIconProps) {
  const code = operator.toUpperCase();
  const legacy = isLegacyOperator(code) ? code : null;
  const Icon = legacy ? icons[legacy] : Bus;
  const accent = operatorAccentColor(code);

  if (legacy) {
    const { wrapper, icon } = OPERATOR_ICON_CLASS[legacy];
    return (
      <div
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-xl",
          wrapper,
          className,
        )}
      >
        <Icon className={cn("size-5", icon)} strokeWidth={1.75} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-xl",
        className,
      )}
      style={{ backgroundColor: `${accent}22`, color: accent }}
    >
      <Icon className="size-5" strokeWidth={1.75} style={{ color: accent }} />
    </div>
  );
}
