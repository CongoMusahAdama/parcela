import Image from "next/image";

export function HeroIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[300px]" aria-hidden>
      <Image
        src="/image.png"
        alt=""
        width={1024}
        height={1024}
        priority
        unoptimized
        className="relative h-auto w-full object-contain"
      />
    </div>
  );
}
