import Image from "next/image";

export function BookHeaderIllustration() {
  return (
    <div className="mx-auto w-full max-w-[260px]">
      <Image
        src="/receiver.png"
        alt="Recipient receiving a parcel"
        width={1536}
        height={1024}
        unoptimized
        priority
        className="mx-auto h-auto max-h-[110px] w-full object-contain sm:max-h-[130px]"
        sizes="260px"
      />
    </div>
  );
}
