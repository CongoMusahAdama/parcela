import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Station", href: (ctx: StepContext) => "/send" },
  {
    id: 2,
    label: "Details",
    href: (ctx: StepContext) =>
      ctx.stationId ? `/send/book?station=${ctx.stationId}` : null,
  },
  {
    id: 3,
    label: "Confirm",
    href: (ctx: StepContext) =>
      ctx.confirmRef ? `/send/confirm?ref=${ctx.confirmRef}` : null,
  },
] as const;

type StepContext = {
  stationId?: string;
  confirmRef?: string;
};

type SendWizardStepsProps = {
  current: 1 | 2 | 3;
  stationId?: string;
  confirmRef?: string;
};

export function SendWizardSteps({ current, stationId, confirmRef }: SendWizardStepsProps) {
  const ctx: StepContext = { stationId, confirmRef };
  const progress = current > 1 ? ((current - 1) / (STEPS.length - 1)) * 100 : 0;

  return (
    <nav aria-label="Booking progress" className="relative w-full px-0.5 pt-1">
      <div
        className="absolute left-[16.67%] right-[16.67%] top-[15px] h-[2px] rounded-full bg-border"
        aria-hidden
      />
      <div
        className="absolute left-[16.67%] top-[15px] h-[2px] rounded-full bg-primary transition-all duration-300"
        style={{ width: `calc(66.66% * ${progress / 100})` }}
        aria-hidden
      />

      <ol className="relative z-10 grid grid-cols-3 gap-0">
        {STEPS.map((step) => {
          const isComplete = step.id < current;
          const isCurrent = step.id === current;
          const href = step.href(ctx);
          const canVisit = step.id <= current && href !== null;
          const isClickable = canVisit && !isCurrent;

          const circle = (
            <span
              className={cn(
                "flex size-[30px] items-center justify-center rounded-full text-[11px] font-bold ring-4 ring-surface transition-colors",
                isComplete && "bg-primary text-white",
                isCurrent && "bg-primary text-white",
                !isComplete &&
                  !isCurrent &&
                  canVisit &&
                  "bg-surface text-muted ring-border",
                !canVisit && "bg-background text-muted/45 ring-border/80"
              )}
            >
              {isComplete ? <Check className="size-3.5" strokeWidth={2.5} /> : step.id}
            </span>
          );

          const label = (
            <span
              className={cn(
                "font-display mt-2 text-[11px] font-semibold leading-none",
                isCurrent && "text-primary",
                isComplete && !isCurrent && "text-foreground",
                !isCurrent && !isComplete && canVisit && "text-muted",
                !canVisit && "text-muted/45"
              )}
            >
              {step.label}
            </span>
          );

          return (
            <li key={step.id} className="flex flex-col items-center">
              {isClickable && href ? (
                <Link
                  href={href}
                  className="flex flex-col items-center rounded-lg px-2 py-1 transition-colors hover:opacity-80 active:scale-[0.98]"
                >
                  {circle}
                  {label}
                </Link>
              ) : (
                <div
                  className={cn(
                    "flex flex-col items-center px-2 py-1",
                    isCurrent && "cursor-default"
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {circle}
                  {label}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
