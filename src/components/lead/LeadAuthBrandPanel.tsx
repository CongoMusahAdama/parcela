import { Logo } from "@/components/brand/Logo";

import { AuthIllustration } from "@/components/auth/AuthIllustration";

import { BarChart3, ClipboardList, MapPin, Users } from "lucide-react";



const FEATURES = [

  { icon: Users, text: "Manage counter staff" },

  { icon: ClipboardList, text: "Branch parcel overview" },

  { icon: BarChart3, text: "Daily reports & analytics" },

] as const;



export function LeadAuthBrandPanel() {

  return (

    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-white px-6 py-6 text-foreground lg:px-8 lg:py-7">

      <div className="relative shrink-0">

        <Logo size="lg" />

        <p className="font-body mt-1.5 text-xs font-medium tracking-wide text-muted">

          Lead · Team · Report

        </p>

      </div>



      <div className="relative my-4 flex flex-1 flex-col items-center justify-center bg-transparent">

        <AuthIllustration

          priority

          variant="light"

          className="w-full max-w-[280px] [&_img]:max-h-[200px]"

        />



        <h1 className="font-display mt-4 max-w-[280px] text-center text-xl font-bold leading-snug tracking-tight text-foreground">

          Your branch, one dashboard

        </h1>

        <p className="font-body mt-1.5 max-w-[260px] text-center text-sm leading-relaxed text-muted">

          Oversee staff, parcels, and daily ops at your terminal.

        </p>

      </div>



      <ul className="relative shrink-0 space-y-2">

        {FEATURES.map(({ icon: Icon, text }) => (

          <li key={text} className="flex items-center gap-2.5">

            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#0D9488]/10 text-[#0D9488]">

              <Icon className="size-3.5" strokeWidth={2.25} />

            </span>

            <p className="font-display text-sm font-semibold text-foreground">{text}</p>

          </li>

        ))}

      </ul>



      <p className="relative mt-4 flex items-center gap-2 text-[11px] text-muted">

        <MapPin className="size-3.5 shrink-0" />

        Branch lead only · Your terminal data

      </p>

    </div>

  );

}

