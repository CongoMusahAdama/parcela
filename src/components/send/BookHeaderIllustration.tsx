import Image from "next/image";

export function BookHeaderIllustration() {
  return (
    <div className="mx-auto w-full max-w-[380px]">
      <Image
        src="/receiver.png"
        alt="Recipient receiving a parcel"
        width={1536}
        height={1024}
        unoptimized
        priority
        className="h-auto max-h-[140px] w-full object-contain sm:max-h-[200px] lg:max-h-[240px]"
        sizes="(max-width: 448px) 380px, 380px"
      />
    </div>
  );
}
