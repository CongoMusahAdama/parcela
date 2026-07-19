"use client";

import { Building2, MapPin, Network, Settings, Shield } from "lucide-react";
import { useClientReady } from "@/hooks/use-client-ready";
import { getAdminTimeGreeting } from "@/lib/admin-auth";

const FEATURES = [
  { icon: Network, text: "All branches, one view" },
  { icon: Building2, text: "Configure your transport network" },
  { icon: Settings, text: "Assign branch leads & stations" },
  { icon: Shield, text: "Operator-wide controls" },
] as const;

export function AdminAuthBrandPanel() {
  const ready = useClientReady();
  const greeting = ready ? getAdminTimeGreeting() : "Welcome";

  return (
    <div className="text-white">
      <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-white/70">
        {greeting}
      </p>
      <h1 className="font-display mt-3 max-w-lg text-[1.75rem] font-bold leading-[1.15] tracking-tight text-white sm:text-[2.1rem] lg:text-[2.35rem]">
        Your network.
        <br />
        One HQ dashboard.
      </h1>
      <p className="font-body mt-4 max-w-md text-sm leading-relaxed text-white/90 sm:text-base">
        Configure branches, assign leads, and run your transport company from a single headquarters
        portal — provisioned by Parcela.
      </p>

      <ul className="mt-6 space-y-3 lg:mt-8">
        {FEATURES.map(({ icon: Icon, text }) => (
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
        Headquarters access · Provisioned by Parcela
      </p>
    </div>
  );
}
