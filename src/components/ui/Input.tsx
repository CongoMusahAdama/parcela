import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: boolean;
};

export function Input({ className, icon, ...props }: InputProps) {
  if (icon) {
    return (
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          className={cn(
            "font-body w-full min-h-12 rounded-2xl border border-border bg-surface py-3 pl-11 pr-4 text-base text-foreground shadow-sm placeholder:text-muted/60 outline-none transition-all focus:border-primary focus:shadow-[0_0_0_3px_rgb(13_148_136/0.12)]",
            className
          )}
          {...props}
        />
      </div>
    );
  }

  return (
    <input
      className={cn(
        "font-body w-full min-h-12 rounded-2xl border border-border bg-surface px-4 text-base text-foreground shadow-sm placeholder:text-muted/60 outline-none transition-all focus:border-primary focus:shadow-[0_0_0_3px_rgb(13_148_136/0.12)]",
        className
      )}
      {...props}
    />
  );
}
