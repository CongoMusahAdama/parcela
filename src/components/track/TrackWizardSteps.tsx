import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Code", href: (ctx: StepContext) => "/track" },
  {
    id: 2,
    label: "Status",
    href: (ctx: StepContext) => (ctx.code ? `/track/status?code=${encodeURIComponent(ctx.code)}` : null),
  },
  {
    id: 3,
    label: "Map",
    href: (ctx: StepContext) =>
      ctx.code ? `/track/station?code=${encodeURIComponent(ctx.code)}` : null,
  },
  {
    id: 4,
    label: "Collect",
    href: (ctx: StepContext) =>
      ctx.code ? `/track/collect?code=${encodeURIComponent(ctx.code)}` : null,
  },
] as const;

type StepContext = {
  code?: string;
};

type TrackWizardStepsProps = {
  current: 1 | 2 | 3 | 4;
  code?: string;
};

export function TrackWizardSteps({ current, code }: TrackWizardStepsProps) {
  const ctx: StepContext = { code };
  const progress = current > 1 ? ((current - 1) / (STEPS.length - 1)) * 100 : 0;

  return (
    <nav aria-label="Tracking progress" className="relative w-full px-0.5 pt-1">
      <div
        className="absolute left-[12.5%] right-[12.5%] top-[15px] h-[2px] rounded-full bg-border"
        aria-hidden
      />
      <div
        className="absolute left-[12.5%] top-[15px] h-[2px] rounded-full bg-primary transition-all duration-300"
        style={{ width: `calc(75% * ${progress / 100})` }}
        aria-hidden
      />

      <ol className="relative z-10 grid grid-cols-4 gap-0">
        {STEPS.map((step) => {
          const isComplete = step.id < current;
          const isCurrent = step.id === current;
          const href = step.href(ctx);
          const canVisit = step.id <= current && href !== null;
          const isClickable = canVisit && !isCurrent;

          const circle = (
            <span
              className={cn(
                "flex size-[28px] items-center justify-center rounded-full text-[10px] font-bold ring-4 ring-surface transition-colors",
                isComplete && "bg-primary text-white",
                isCurrent && "bg-primary text-white",
                !isComplete &&
                  !isCurrent &&
                  canVisit &&
                  "bg-surface text-muted ring-border",
                !canVisit && "bg-background text-muted/45 ring-border/80"
              )}
            >
              {isComplete ? <Check className="size-3" strokeWidth={2.5} /> : step.id}
            </span>
          );

          const label = (
            <span
              className={cn(
                "font-display mt-1.5 text-[10px] font-semibold leading-none",
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
                  className="flex flex-col items-center rounded-lg px-1 py-1 transition-colors hover:opacity-80 active:scale-[0.98]"
                >
                  {circle}
                  {label}
                </Link>
              ) : (
                <div
                  className={cn(
                    "flex flex-col items-center px-1 py-1",
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
