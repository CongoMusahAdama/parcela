import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  shellClassName?: string;
  variant?: "default" | "hero";
  /** Lock to viewport height with internal scroll regions (mobile-friendly). Defaults to true when a footer is present. */
  viewport?: boolean;
};

export function AppShell({
  children,
  footer,
  className,
  shellClassName,
  variant = "default",
  viewport: viewportProp,
}: AppShellProps) {
  const viewport = viewportProp ?? Boolean(footer);

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-[430px] flex-col",
        viewport ? "h-dvh max-h-[100dvh] min-h-0 overflow-hidden" : "min-h-dvh",
        variant === "hero" ? "mesh-hero" : "bg-background",
        shellClassName
      )}
    >
      <main
        className={cn(
          viewport
            ? "flex min-h-0 flex-1 flex-col overflow-hidden !px-0 !pb-0 !pt-0"
            : "flex-1 px-5 pb-8 pt-5",
          className
        )}
      >
        {children}
      </main>
      {footer ? (
        <footer className="safe-bottom z-10 shrink-0 border-t border-border/80 bg-surface/95 px-4 py-3 backdrop-blur-md">
          {footer}
        </footer>
      ) : null}
    </div>
  );
}
