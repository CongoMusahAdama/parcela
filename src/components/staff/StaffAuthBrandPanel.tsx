import { Logo } from "@/components/brand/Logo";
import { AuthIllustration } from "@/components/auth/AuthIllustration";
import { Bus, MapPin, PackageCheck, ShieldCheck } from "lucide-react";

const FEATURES = [
  { icon: PackageCheck, text: "Verify drop-offs" },
  { icon: Bus, text: "Log & track parcels" },
  { icon: ShieldCheck, text: "Release with pickup code" },
] as const;

export function StaffAuthBrandPanel() {
  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#0D9488] px-6 py-6 text-white lg:px-8 lg:py-7">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 0%, rgb(255 255 255 / 0.1), transparent 55%), linear-gradient(180deg, transparent 65%, rgb(15 118 110 / 0.3) 100%)",
        }}
      />

      <div className="relative shrink-0">
        <Logo size="lg" className="[&_span]:text-white [&_img]:brightness-0 [&_img]:invert" />
        <p className="font-body mt-1.5 text-xs font-medium tracking-wide text-white/80">
          Verify · Log · Release
        </p>
      </div>

      <div className="relative my-4 flex flex-1 flex-col items-center justify-center bg-transparent">
        <AuthIllustration
          priority
          className="w-full max-w-[280px] [&_img]:max-h-[200px]"
        />

        <h1 className="font-display mt-4 max-w-[280px] text-center text-xl font-bold leading-snug tracking-tight text-white">
          Station parcel operations, simplified
        </h1>
        <p className="font-body mt-1.5 max-w-[260px] text-center text-sm leading-relaxed text-white/85">
          One dashboard for your terminal.
        </p>
      </div>

      <ul className="relative shrink-0 space-y-2">
        {FEATURES.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white">
              <Icon className="size-3.5" strokeWidth={2.25} />
            </span>
            <p className="font-display text-sm font-semibold text-white">{text}</p>
          </li>
        ))}
      </ul>

      <p className="relative mt-4 flex items-center gap-2 text-[11px] text-white/65">
        <MapPin className="size-3.5 shrink-0" />
        Staff only · Your station data
      </p>
    </div>
  );
}
