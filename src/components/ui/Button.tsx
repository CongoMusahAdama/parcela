import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "accent" | "outline" | "ghost" | "soft";
  size?: "md" | "lg";
  href?: string;
  fullWidth?: boolean;
};

const variants = {
  primary:
    "bg-gradient-to-r from-primary to-primary-dark text-white shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)] active:scale-[0.98]",
  accent:
    "bg-gradient-to-r from-accent to-accent-dark text-white shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)] active:scale-[0.98]",
  outline:
    "border border-border bg-surface text-foreground shadow-sm hover:border-primary/30 hover:bg-primary/5 active:scale-[0.98]",
  ghost: "text-muted hover:bg-border/40 bg-transparent",
  soft: "bg-primary/10 text-primary-dark hover:bg-primary/15 active:scale-[0.98]",
};

const sizes = {
  md: "min-h-11 px-5 py-2.5 text-sm font-semibold",
  lg: "min-h-[52px] px-6 py-3.5 text-base font-semibold",
};

export function Button({
  variant = "primary",
  size = "lg",
  href,
  fullWidth,
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(
    "font-display inline-flex items-center justify-center gap-2 rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none",
    variants[variant],
    sizes[size],
    fullWidth && "w-full",
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
