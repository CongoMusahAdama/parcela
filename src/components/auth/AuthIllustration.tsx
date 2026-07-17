import Image from "next/image";
import { cn } from "@/lib/utils";

type AuthIllustrationProps = {
  className?: string;
  /** Kept for compatibility — sender.png works on light and dark panels. */
  variant?: "light" | "dark";
  priority?: boolean;
};

export function AuthIllustration({
  className,
  priority = false,
}: AuthIllustrationProps) {
  return (
    <div className={cn("bg-transparent", className)}>
      <Image
        src="/sender.png"
        alt=""
        width={1536}
        height={1024}
        unoptimized
        priority={priority}
        className="h-auto w-full object-contain"
        sizes="(max-width: 448px) 200px, 280px"
      />
    </div>
  );
}
