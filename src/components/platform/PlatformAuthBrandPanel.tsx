"use client";

import { KeyRound, Network, Shield, UserPlus } from "lucide-react";
import { useClientReady } from "@/hooks/use-client-ready";
import { getPlatformTimeGreeting } from "@/lib/platform-auth";

const FEATURES = [
  { icon: Network, text: "Onboard any transport service" },
  { icon: UserPlus, text: "Issue HQ logins after configure" },
  { icon: KeyRound, text: "Reset credentials when needed" },
  { icon: Shield, text: "Suspend or resume an operator" },
] as const;

export function PlatformAuthBrandPanel() {
  const ready = useClientReady();
  const greeting = ready ? getPlatformTimeGreeting() : "Welcome";

  return (
    <div
      className="relative flex h-full min-h-[720px] flex-col overflow-hidden px-8 py-12 text-white lg:px-10 lg:py-14"
      style={{ background: "var(--platform-header-gradient)" }}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-white/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-10 size-48 rounded-full bg-black/10 blur-3xl"
        aria-hidden
      />

      <div className="relative shrink-0">
        <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-white/70">
          Welcome
        </p>
        <h1 className="font-display mt-2 text-[1.75rem] font-bold leading-tight tracking-tight text-white">
          {greeting}
        </h1>
        <p className="font-body mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85">
          Platform control
        </p>
      </div>

      <div className="relative my-8 flex flex-1 flex-col justify-center border-y border-white/25 py-10 lg:py-12">
        <p className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-white/65">
          Parcela internal
        </p>
        <h2 className="font-display mt-3 max-w-[340px] text-[1.65rem] font-bold leading-snug tracking-tight text-white lg:text-[1.85rem]">
          Set up transports. Hand them the keys.
        </h2>
        <p className="font-body mt-4 max-w-[360px] text-sm leading-relaxed text-white/85">
          Onboard any transport, configure them fully, then hand over HQ logins. Their HQ creates
          branch leads — or contacts you when they need help.
        </p>
      </div>

      <ul className="relative shrink-0 space-y-3">
        {FEATURES.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/30 bg-white/15 text-white">
              <Icon className="size-3.5" strokeWidth={2.25} />
            </span>
            <p className="font-display text-sm font-semibold text-white">{text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
