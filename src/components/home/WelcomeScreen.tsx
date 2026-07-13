"use client";

import { MapPin, Package, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { StepItem } from "@/components/home/StepItem";
import { SendHeaderIllustration } from "@/components/send/SendHeaderIllustration";
import { Button } from "@/components/ui/Button";
import { AppShell } from "@/components/ui/AppShell";
import { Card } from "@/components/ui/Card";

type WelcomeScreenProps = {
  onGetStarted: () => void;
};

export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  return (
    <AppShell variant="hero" className="flex min-h-[calc(100dvh-2.5rem)] flex-col !pb-6">
      <header className="mb-4 flex items-center justify-between gap-3">
        <span className="font-body shrink-0 rounded-full bg-surface/80 px-3 py-1 text-xs font-medium text-muted shadow-sm">
          Partner transport stations
        </span>
        <Logo size="lg" className="shrink-0" />
      </header>

      <section className="text-center">
        <SendHeaderIllustration />
        <h1 className="font-display animate-fade-up mt-4 text-[1.65rem] font-bold leading-tight tracking-tight text-foreground opacity-0">
          Welcome to Parcela
        </h1>
        <p className="font-body animate-fade-up-delay-1 mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted opacity-0">
          Send and track parcels through partner transport stations across Ghana.
        </p>
      </section>

      <Card
        variant="glass"
        className="animate-fade-up-delay-2 mt-5 flex-1 opacity-0 shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
      >
        <p className="font-display text-[15px] font-bold tracking-tight text-foreground">
          How it works
        </p>
        <div className="mt-4">
          <div className="animate-fade-up-delay-3 opacity-0">
            <StepItem
              step={1}
              title="Choose a station"
              description="Pick the nearest bus station for drop-off."
              icon={MapPin}
            />
          </div>
          <div className="animate-fade-up-delay-4 opacity-0">
            <StepItem
              step={2}
              title="Enter parcel details"
              description="Add sender, recipient, and parcel info online."
              icon={Package}
            />
          </div>
          <div className="animate-fade-up-delay-5 opacity-0">
            <StepItem
              step={3}
              title="Drop off & go"
              description="Take your parcel to the station with your booking reference."
              icon={ShieldCheck}
              isLast
            />
          </div>
        </div>
      </Card>

      <Button
        type="button"
        fullWidth
        onClick={onGetStarted}
        className="animate-fade-up-delay-6 mt-5 opacity-0"
      >
        Get started
      </Button>
    </AppShell>
  );
}
