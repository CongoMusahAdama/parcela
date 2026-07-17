import Image from "next/image";

export function TrackHeaderIllustration() {
  return (
    <div className="mx-auto w-full">
      <Image
        src="/receiver1.png"
        alt="Recipient tracking a parcel"
        width={1536}
        height={1024}
        unoptimized
        priority
        className="h-auto max-h-[140px] w-full object-contain sm:max-h-[220px] lg:max-h-[280px]"
        sizes="(max-width: 448px) 100vw, 448px"
      />
    </div>
  );
}
