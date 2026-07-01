import { Bus, BusFront } from "lucide-react";
import type { Operator } from "@/types/parcel";
import { OPERATOR_ICON_CLASS } from "@/lib/operators";
import { cn } from "@/lib/utils";

type StationIconProps = {
  operator: Operator;
  className?: string;
};

const icons: Record<Operator, typeof Bus> = {
  VIP: Bus,
  STC: BusFront,
};

export function StationIcon({ operator, className }: StationIconProps) {
  const Icon = icons[operator];
  const { wrapper, icon } = OPERATOR_ICON_CLASS[operator];

  return (
    <div
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-xl",
        wrapper,
        className
      )}
    >
      <Icon className={cn("size-5", icon)} strokeWidth={1.75} />
    </div>
  );
}
