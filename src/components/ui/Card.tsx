import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "elevated" | "glass";
};

export function Card({
  className,
  variant = "default",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl p-4",
        variant === "default" && "border border-border bg-surface shadow-[var(--shadow-soft)]",
        variant === "elevated" &&
          "border border-border/60 bg-surface shadow-[var(--shadow-card)]",
        variant === "glass" && "glass shadow-[var(--shadow-soft)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
