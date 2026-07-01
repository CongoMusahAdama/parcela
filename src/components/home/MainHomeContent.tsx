"use client";

import { MapPin, Package } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ActionCard } from "@/components/home/ActionCard";
import { SendParcelAction } from "@/components/home/SendParcelAction";
import { HeroIllustration } from "@/components/home/HeroIllustration";
import { AppShell } from "@/components/ui/AppShell";

export function MainHomeContent() {
  return (
    <AppShell variant="hero">
      <div className="flex min-h-[calc(100dvh-2.5rem)] flex-col">
        <header className="mb-6 flex items-center justify-between gap-3">
          <span className="font-body shrink-0 rounded-full bg-surface/80 px-3 py-1 text-xs font-medium text-muted shadow-sm">
            VIP &amp; STC only
          </span>
          <Logo size="lg" className="shrink-0" />
        </header>

        <section className="mb-6 text-center">
          <HeroIllustration />
          <h1 className="font-display mt-5 text-[1.65rem] font-bold leading-tight tracking-tight text-foreground">
            Send parcels through
            <span className="block text-primary">bus stations, easily</span>
          </h1>
          <p className="font-body mx-auto mt-2.5 max-w-[18rem] text-sm leading-relaxed text-muted">
            Pre-book in minutes. No account needed — drop off at your station.
          </p>
        </section>

        <section className="mt-8 space-y-2.5">
          <SendParcelAction
            title="Send a parcel"
            description="Find a station and pre-book"
            icon={Package}
          />
          <ActionCard
            href="/track"
            title="Track a parcel"
            description="Enter the code from your receipt"
            icon={MapPin}
            variant="secondary"
          />
        </section>
      </div>
    </AppShell>
  );
}
