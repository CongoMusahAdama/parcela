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
          compact ? "max-h-[200px] max-w-[200px]" : "mx-auto w-full max-h-[300px]"
        )}
        sizes={compact ? "200px" : "(max-width: 448px) 100vw, 448px"}
      />
    </div>
  );
}
