import { BarChart3, Bus, MapPin, PackageCheck, ShieldCheck, Users } from "lucide-react";
import type { OperatorLoginMode } from "@/lib/operator-auth";

const STAFF_FEATURES = [
  { icon: PackageCheck, text: "Verify drop-offs" },
  { icon: Bus, text: "Log & track parcels" },
  { icon: ShieldCheck, text: "Release with pickup code" },
] as const;

const LEAD_FEATURES = [
  { icon: Users, text: "Manage counter staff" },
  { icon: PackageCheck, text: "Branch parcel overview" },
  { icon: BarChart3, text: "Reports & analytics" },
] as const;

type OperatorAuthBrandPanelProps = {
  mode: OperatorLoginMode;
};

export function OperatorAuthBrandPanel({ mode }: OperatorAuthBrandPanelProps) {
  const isStaff = mode === "staff";
  const features = isStaff ? STAFF_FEATURES : LEAD_FEATURES;

  return (
    <div className="text-white">
      <p className="font-body text-xs font-medium tracking-wide text-white/85">
        {isStaff ? "Station staff portal" : "Branch lead portal"}
      </p>

      <h1 className="font-display mt-3 max-w-lg text-[1.75rem] font-bold leading-[1.15] tracking-tight text-white sm:text-[2.1rem] lg:text-[2.35rem]">
        {isStaff ? "Run your terminal." : "Lead your branch."}
        <br />
        {isStaff ? "Parcel ops made simple." : "Staff & parcels in one place."}
      </h1>
      <p className="font-body mt-3 max-w-md text-sm leading-relaxed text-white/90 sm:mt-4 sm:text-base">
        {isStaff
          ? "Verify drop-offs, log parcels in transit, and release collections with pickup codes."
          : "Oversee counter staff, monitor branch parcels, and keep daily operations on track."}
      </p>

      <ul className="mt-6 space-y-3 lg:mt-8">
        {features.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-white backdrop-blur-sm">
              <Icon className="size-4" strokeWidth={2.25} />
            </span>
            <p className="font-display text-sm font-semibold text-white sm:text-base">{text}</p>
          </li>
        ))}
      </ul>

      <p className="font-body mt-6 flex items-center gap-2 text-xs text-white/75 lg:mt-8">
        <MapPin className="size-3.5 shrink-0" />
        {isStaff ? "Counter sign-in · Your station data" : "Branch lead sign-in · Your branch data"}
      </p>
    </div>
  );
}
