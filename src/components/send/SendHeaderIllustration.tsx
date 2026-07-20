import Image from "next/image";

export function SendHeaderIllustration() {
  return (
    <div className="mx-auto w-full max-w-[320px]">
      <Image
        src="/sender.png"
        alt="Parcel delivery illustration"
        width={1536}
        height={1024}
        unoptimized
        priority
        className="mx-auto h-auto max-h-[140px] w-full object-contain sm:max-h-[160px]"
        sizes="320px"
      />
    </div>
  );
}
