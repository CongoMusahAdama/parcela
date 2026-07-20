import Image from "next/image";

export function TrackHeaderIllustration() {
  return (
    <div className="mx-auto w-full max-w-[280px]">
      <Image
        src="/receiver1.png"
        alt="Recipient tracking a parcel"
        width={1536}
        height={1024}
        unoptimized
        priority
        className="mx-auto h-auto max-h-[120px] w-full object-contain sm:max-h-[140px]"
        sizes="280px"
      />
    </div>
  );
}
