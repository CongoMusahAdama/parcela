import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  className?: string;
  centered?: boolean;
};

export function PageHeader({
  title,
  subtitle,
  backHref,
  className,
  centered,
}: PageHeaderProps) {
  return (
    <header className={cn("mb-6", centered && "text-center", className)}>
      {backHref && (
        <Link
          href={backHref}
          className="font-display mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-primary/30 hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
      )}
      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
        {title}
      </h1>
      {subtitle && (
        <p className="font-body mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>
      )}
    </header>
  );
}
