import Image from "next/image";
import { MapPin } from "lucide-react";

type TrackMapIllustrationProps = {
  className?: string;
  size?: number;
  showPin?: boolean;
};

export function TrackMapIllustration({
  className,
  size = 72,
  showPin = true,
}: TrackMapIllustrationProps) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-2xl ring-2 ring-primary/15 shadow-[0_8px_24px_rgba(13,148,136,0.12)] ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/map.png"
        alt=""
        width={size}
        height={size}
        className="h-full w-full object-cover"
        priority
      />
      {showPin ? (
        <span className="absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full bg-primary text-white shadow-md ring-2 ring-surface">
          <MapPin className="size-3" />
        </span>
      ) : null}
    </div>
  );
}
