import Image from "next/image";

export function SendHeaderIllustration() {
  return (
    <div className="mx-auto w-full">
      <Image
        src="/sender.png"
        alt="Parcel delivery illustration"
        width={1536}
        height={1024}
        unoptimized
        priority
        className="h-auto max-h-[150px] w-full object-contain sm:max-h-[200px] lg:max-h-[260px]"
        sizes="(max-width: 448px) 100vw, 448px"
      />
    </div>
  );
}
