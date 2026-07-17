"use client";

import { MapPin, Package } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ActionCard } from "@/components/home/ActionCard";
import { SendParcelAction } from "@/components/home/SendParcelAction";
import { HeroIllustration } from "@/components/home/HeroIllustration";
import { AppShell } from "@/components/ui/AppShell";

export function MainHomeContent() {
  return (
    <AppShell variant="hero" viewport className="!px-5 !pt-5">
      <div className="mobile-scroll min-h-0 flex-1 pb-8">
      <div className="flex min-h-0 flex-col">
        <header className="mb-6 flex items-center justify-between gap-3">
          <span className="font-body shrink-0 rounded-full border border-border bg-surface px-3 py-1.5 text-[11px] font-medium text-muted">
            Partner transport stations
          </span>
          <Logo size="lg" className="shrink-0" />
        </header>

        <section className="mb-2 text-center">
          <HeroIllustration />
          <h1 className="font-display mt-4 text-[1.55rem] font-bold leading-[1.2] tracking-tight text-foreground">
            Send parcels through
            <span className="block text-primary">bus stations, easily</span>
          </h1>
          <p className="font-body mx-auto mt-2 max-w-[300px] text-sm leading-[1.5] text-muted">
            Pre-book in minutes. No account needed — drop off at your station.
          </p>
        </section>

        <section className="mt-8 space-y-3">
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
      </div>
    </AppShell>
  );
}
