import Image from "next/image";
import { cn } from "@/lib/utils";

type TrackStatusIllustrationProps = {
  compact?: boolean;
  className?: string;
};

export function TrackStatusIllustration({
  compact = true,
  className,
}: TrackStatusIllustrationProps) {
  return (
    <div className={cn(compact ? "shrink-0" : "mx-auto w-full", className)}>
      <Image
        src="/receiver.png"
        alt="Recipient tracking a parcel"
        width={1536}
        height={1024}
        unoptimized
        priority
        className={cn(
          "h-auto object-contain",
          compact
            ? "mx-auto max-h-[100px] max-w-[160px]"
            : "mx-auto w-full max-h-[140px] max-w-[240px]",
        )}
        sizes={compact ? "160px" : "240px"}
      />
    </div>
  );
}
