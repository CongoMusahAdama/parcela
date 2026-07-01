import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StepItemProps = {
  step: number;
  title: string;
  description: string;
  icon: LucideIcon;
  className?: string;
  isLast?: boolean;
};

export function StepItem({
  step,
  title,
  description,
  icon: Icon,
  className,
  isLast = false,
}: StepItemProps) {
  return (
    <div className={cn("flex gap-3.5", !isLast && "pb-1", className)}>
      <div className="flex flex-col items-center">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary shadow-sm">
          <Icon className="size-[18px]" strokeWidth={2.25} />
        </div>
        {!isLast ? <div className="my-1.5 w-0.5 flex-1 min-h-5 rounded-full bg-primary/20" /> : null}
      </div>
      <div className={cn("min-w-0 flex-1", !isLast && "pb-4")}>
        <div className="flex items-center gap-2">
          <span className="font-display flex size-[22px] shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
            {step}
          </span>
          <p className="font-display text-[15px] font-bold leading-snug text-foreground">{title}</p>
        </div>
        <p className="font-body mt-1.5 text-[13px] leading-relaxed text-muted">{description}</p>
      </div>
    </div>
  );
}
