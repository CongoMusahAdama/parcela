"use client";

import { Building2, MapPin, Network, Settings, Shield } from "lucide-react";
import { getAdminTimeGreeting } from "@/lib/admin-auth";

const FEATURES = [
  { icon: Network, text: "All branches, one view" },
  { icon: Building2, text: "Configure your transport network" },
  { icon: Settings, text: "Assign branch leads & stations" },
  { icon: Shield, text: "Operator-wide controls" },
] as const;

export function AdminAuthBrandPanel() {
  const greeting = getAdminTimeGreeting();

  return (
    <div className="relative flex h-full min-h-[720px] flex-col overflow-hidden bg-white px-8 py-12 text-foreground lg:px-10 lg:py-14">
      <div className="relative shrink-0">
        <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-[#94a3b8]">
          Welcome
        </p>
        <h1 className="font-display mt-2 text-[1.75rem] font-bold leading-tight tracking-tight text-[#0f172a]">
          {greeting}
        </h1>
        <p className="font-body mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">
          HQ command center
        </p>
      </div>

      <div className="relative my-8 flex flex-1 flex-col justify-center border-y border-[#e2e8f0] py-10 lg:py-12">
        <p className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-[#94a3b8]">
          Operator network
        </p>
        <h2 className="font-display mt-3 max-w-[340px] text-[1.65rem] font-bold leading-snug tracking-tight text-[#0f172a] lg:text-[1.75rem]">
          Your network. One dashboard.
        </h2>
        <p className="font-body mt-4 max-w-[360px] text-sm leading-relaxed text-[#64748b]">
          Parcela provisions your HQ account. Configure your transport company after sign-in —
          then manage branches, leads, and operator-wide analytics from one place.
        </p>
      </div>

      <ul className="relative shrink-0 space-y-3">
        {FEATURES.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-[#0f172a]">
              <Icon className="size-3.5" strokeWidth={2.25} />
            </span>
            <p className="font-display text-sm font-semibold text-[#334155]">{text}</p>
          </li>
        ))}
      </ul>

      <p className="relative mt-6 flex items-center gap-2 text-[11px] text-[#94a3b8]">
        <MapPin className="size-3.5 shrink-0" />
        Headquarters only · Provisioned by Parcela
      </p>
    </div>
  );
}
