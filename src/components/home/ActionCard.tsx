import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ActionCardProps = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  variant?: "primary" | "secondary";
  className?: string;
};

export function ActionCard({
  href,
  title,
  description,
  icon: Icon,
  variant = "primary",
  className,
}: ActionCardProps) {
  const isPrimary = variant === "primary";

  return (
    <Link
      href={href}
      className={cn(
        "group flex min-h-14 items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 active:scale-[0.99]",
        isPrimary
          ? "bg-primary text-white shadow-[0_4px_16px_rgb(13_148_136/0.28)]"
          : "border-2 border-primary bg-surface text-foreground",
        className
      )}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-[10px]",
          isPrimary ? "bg-white/15" : "bg-primary/10 text-primary"
        )}
      >
        <Icon className="size-5" strokeWidth={2.25} />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "font-display text-base font-bold leading-tight",
            !isPrimary && "text-primary-dark"
          )}
        >
          {title}
        </p>
        <p
          className={cn(
            "font-body mt-0.5 text-xs leading-snug",
            isPrimary ? "text-white/80" : "text-muted"
          )}
        >
          {description}
        </p>
      </div>

      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          isPrimary ? "bg-white text-primary" : "bg-primary text-white"
        )}
      >
        <ArrowRight className="size-4" strokeWidth={2.5} />
      </span>
    </Link>
  );
}
