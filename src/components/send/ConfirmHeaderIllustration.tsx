import Image from "next/image";

export function ConfirmHeaderIllustration() {
  return (
    <div className="mx-auto w-full max-w-[380px]">
      <Image
        src="/confirmed.jpg"
        alt="Booking confirmed"
        width={800}
        height={600}
        unoptimized
        priority
        className="h-auto max-h-[130px] w-full object-contain"
        sizes="(max-width: 448px) 380px, 380px"
      />
    </div>
  );
}
