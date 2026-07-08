import Image from "next/image";
import { cn } from "@/lib/utils";

type AuthIllustrationProps = {
  className?: string;
  /** multiply — white panel; screen — teal/dark panel */
  variant?: "light" | "dark";
  priority?: boolean;
};

export function AuthIllustration({
  className,
  variant = "light",
  priority = false,
}: AuthIllustrationProps) {
  return (
    <div className={cn("bg-transparent", className)}>
      <Image
        src="/Auth.jpg"
        alt=""
        width={800}
        height={800}
        priority={priority}
        className={cn(
          "h-auto w-full bg-transparent object-contain",
          variant === "dark" ? "mix-blend-screen" : "mix-blend-multiply",
        )}
      />
    </div>
  );
}
