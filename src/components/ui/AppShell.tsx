import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  shellClassName?: string;
  variant?: "default" | "hero";
};

export function AppShell({
  children,
  footer,
  className,
  shellClassName,
  variant = "default",
}: AppShellProps) {
  return (
    <div
      className={cn(
        "mx-auto flex min-h-dvh w-full max-w-[430px] flex-col",
        variant === "hero" ? "mesh-hero" : "bg-background",
        shellClassName
      )}
    >
      <main className={cn("flex-1 px-5 pb-8 pt-5", className)}>{children}</main>
      {footer && (
        <footer className="sticky bottom-0 border-t border-border/80 bg-surface/90 px-5 py-4 backdrop-blur-lg safe-bottom">
          {footer}
        </footer>
      )}
    </div>
  );
}
