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
        className="h-auto max-h-[140px] w-full object-contain sm:max-h-[200px] lg:max-h-[260px]"
        sizes="(max-width: 448px) 100vw, 448px"
      />
    </div>
  );
}
