import Image from "next/image";

export function TrackCollectIllustration() {
  return (
    <div className="mx-auto w-full">
      <Image
        src="/collection.png"
        alt="Recipient collecting a parcel at the station"
        width={1536}
        height={1024}
        unoptimized
        priority
        className="h-auto max-h-[360px] w-full object-contain"
        sizes="(max-width: 448px) 100vw, 448px"
      />
    </div>
  );
}
