"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronDown, MapPin, Package, ShieldCheck } from "lucide-react";
import { PartnerTransportsSection } from "@/components/home/PartnerTransportsSection";
import { Reveal } from "@/components/home/Reveal";
import { SectionHeading } from "@/components/home/SectionHeading";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    step: "01",
    title: "Choose a station",
    description: "Pick a partner bus station near you for drop-off.",
    icon: MapPin,
  },
  {
    step: "02",
    title: "Pre-book online",
    description: "Add sender, recipient, and parcel details in minutes.",
    icon: Package,
  },
  {
    step: "03",
    title: "Drop off & track",
    description: "Hand in at the station. Recipients track with a pickup code.",
    icon: ShieldCheck,
  },
] as const;

const FAQS = [
  {
    q: "Do I need an account to send a parcel?",
    a: "No. Anyone can pre-book online without signing up. You’ll get a booking reference to take to the station when you drop off.",
  },
  {
    q: "How does the receiver track or collect?",
    a: "Share the pickup code from your receipt. The receiver enters it on Track to see status, station details, and when the parcel is ready for collection.",
  },
  {
    q: "Which stations can I use?",
    a: "Parcela works with partner transport stations. On Send, you can search and filter by city or operator to find a drop-off station near you.",
  },
  {
    q: "What happens after I pre-book?",
    a: "Take your parcel and booking reference to the chosen station. Staff confirm the drop-off, then the parcel moves with the partner transport service toward the destination station.",
  },
  {
    q: "Is Parcela a transport company?",
    a: "No. Parcela is the booking and tracking software. Your parcel travels through partner bus and transport stations that use the platform.",
  },
] as const;

const navLinkClass =
  "font-display rounded-xl px-3 py-2 text-sm font-semibold text-white/90 transition-colors hover:bg-white/15 hover:text-white";

function FaqItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-slate-900/8 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="font-display text-sm font-bold text-foreground sm:text-base">
          {question}
        </span>
        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-primary transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <p className="font-body pb-4 text-sm leading-relaxed text-muted">{answer}</p>
        </div>
      </div>
    </div>
  );
}

export function LandingHome() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-dvh bg-[#e8eef4] text-foreground">
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:h-[4.25rem] sm:px-8">
          <Logo size="lg" className="[&_span]:text-white drop-shadow-md" />
          <nav className="flex items-center gap-1 sm:gap-2">
            <a href="#partners" className={cn(navLinkClass, "hidden md:inline-flex")}>
              Partners
            </a>
            <a href="#about" className={cn(navLinkClass, "hidden md:inline-flex")}>
              About
            </a>
            <a href="#faq" className={cn(navLinkClass, "hidden md:inline-flex")}>
              FAQs
            </a>
            <Link href="/track" className={cn(navLinkClass, "hidden sm:inline-flex")}>
              Track
            </Link>
            <Link
              href="/send"
              className="font-display inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_rgb(13_148_136/0.45)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Send
              <ArrowRight className="size-3.5" strokeWidth={2.5} />
            </Link>
          </nav>
        </div>
      </header>

      {/* Full-bleed hero — image is the background */}
      <section className="relative min-h-[min(100dvh,880px)] overflow-hidden bg-slate-900">
        <Image
          src="/landing/hero-bg.png"
          alt=""
          fill
          priority
          aria-hidden
          className="object-cover object-[72%_center] sm:object-[65%_center] lg:object-center"
          sizes="100vw"
        />
        {/* Soft readability veil — keeps the coach/parcels visible on the right */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-slate-900/25 sm:bg-gradient-to-r sm:from-slate-950/88 sm:via-slate-950/55 sm:to-slate-900/10"
          aria-hidden
        />

        <div className="relative z-10 mx-auto flex min-h-[min(100dvh,880px)] max-w-6xl flex-col justify-between px-5 pb-16 pt-24 sm:px-8 sm:pb-24 sm:pt-28">
          <div className="max-w-xl pt-6 sm:pt-10 lg:pt-14">
            <p className="font-display animate-fade-up text-[11px] font-bold uppercase tracking-[0.18em] text-primary-light opacity-0">
              Partner transport stations · Ghana
            </p>
            <h1 className="font-display animate-fade-up-delay-1 mt-3 text-[clamp(3rem,10vw,5.5rem)] font-extrabold leading-[0.9] tracking-tight text-white opacity-0 drop-shadow-[0_2px_24px_rgb(0_0_0/0.35)]">
              Parcela
            </h1>
            <p className="font-display animate-fade-up-delay-2 mt-4 text-[clamp(1.25rem,3.5vw,1.85rem)] font-bold leading-snug tracking-tight text-white opacity-0">
              Send parcels through bus stations, easily
            </p>
            <p className="font-body animate-fade-up-delay-3 mt-3 max-w-md text-base leading-relaxed text-white/80 opacity-0 sm:text-lg">
              Pre-book online, drop off at a partner station, and let recipients
              track with a pickup code — no account needed.
            </p>
          </div>

          <div className="animate-fade-up-delay-4 mt-10 flex max-w-xl flex-col gap-3 opacity-0 sm:mt-0 sm:flex-row sm:items-center">
            <Link
              href="/send"
              className="font-display inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-dark px-7 text-base font-semibold text-white shadow-[0_8px_28px_rgb(13_148_136/0.45)] transition-all hover:shadow-[0_12px_32px_rgb(13_148_136/0.55)] active:scale-[0.98]"
            >
              <Package className="size-5" strokeWidth={2.25} />
              Send a parcel
            </Link>
            <Link
              href="/track"
              className="font-display inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border-2 border-white bg-white px-7 text-base font-semibold text-primary shadow-[0_8px_24px_rgb(0_0_0/0.18)] transition-colors hover:bg-white/95 active:scale-[0.98]"
            >
              <MapPin className="size-5" strokeWidth={2.25} />
              Track a parcel
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-900/5 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="max-w-xl">
            <SectionHeading className="text-2xl sm:text-3xl">How it works</SectionHeading>
            <Reveal delay={1}>
              <p className="font-body mt-3 text-sm leading-relaxed text-muted sm:text-base">
                Book through the software, move through partner stations — clear
                for senders and receivers.
              </p>
            </Reveal>
          </div>

          <ol className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6">
            {STEPS.map(({ step, title, description, icon: Icon }, index) => (
              <Reveal key={step} delay={(index + 1) as 1 | 2 | 3}>
                <li>
                  <span className="font-display text-4xl font-extrabold text-primary/15">
                    {step}
                  </span>
                  <div className="mt-2 flex items-center gap-2.5">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-[18px]" strokeWidth={2.25} />
                    </span>
                    <h3 className="font-display text-lg font-bold text-foreground">
                      {title}
                    </h3>
                  </div>
                  <p className="font-body mt-2 text-sm leading-relaxed text-muted">
                    {description}
                  </p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <PartnerTransportsSection />

      {/* Send / receive with real logistics photos */}
      <section className="border-t border-slate-900/5 bg-[#e8eef4]">
        <div className="mx-auto grid max-w-6xl gap-5 px-5 py-16 sm:gap-6 sm:px-8 sm:py-20 md:grid-cols-2">
          <Reveal>
            <Link
              href="/send"
              className="group relative block min-h-[280px] overflow-hidden rounded-[1.75rem] shadow-[0_16px_40px_rgb(15_23_42/0.14)] transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              <Image
                src="/landing/hero-pack.jpg"
                alt="Preparing a parcel for station drop-off"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-slate-900/20"
                aria-hidden
              />
              <div className="relative z-10 flex h-full min-h-[280px] flex-col justify-end px-7 py-8 text-white sm:px-8 sm:py-10">
                <p className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">
                  For senders
                </p>
                <SectionHeading light className="mt-3 text-2xl sm:text-3xl">
                  Ready to send?
                </SectionHeading>
                <p className="font-body mt-3 max-w-sm text-sm leading-relaxed text-white/80">
                  Find a station, pre-book your parcel, and get a booking reference
                  for drop-off.
                </p>
                <span className="font-display mt-6 inline-flex items-center gap-2 text-sm font-semibold">
                  Start sending
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          </Reveal>

          <Reveal delay={1}>
            <Link
              href="/track"
              className="group relative block min-h-[280px] overflow-hidden rounded-[1.75rem] shadow-[0_16px_40px_rgb(15_23_42/0.14)] transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              <Image
                src="/landing/receive-hands.jpg"
                alt="Hands exchanging a parcel package"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-slate-900/15"
                aria-hidden
              />
              <div className="relative z-10 flex h-full min-h-[280px] flex-col justify-end px-7 py-8 text-white sm:px-8 sm:py-10">
                <p className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-primary-light">
                  For receivers
                </p>
                <SectionHeading light className="mt-3 text-2xl sm:text-3xl">
                  Expecting a parcel?
                </SectionHeading>
                <p className="font-body mt-3 max-w-sm text-sm leading-relaxed text-white/80">
                  Enter the pickup code from the sender&apos;s receipt to see status
                  and collection details.
                </p>
                <span className="font-display mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-light">
                  Track now
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          </Reveal>
        </div>
      </section>

      <section id="about" className="scroll-mt-20 border-t border-slate-900/5 bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-14">
          <div>
            <SectionHeading className="text-2xl sm:text-3xl">About Parcela</SectionHeading>
            <Reveal delay={1}>
              <p className="font-body mt-4 text-sm leading-relaxed text-muted sm:text-base">
                Parcela is booking and tracking software for parcels that move
                through partner bus and transport stations across Ghana.
              </p>
            </Reveal>
            <Reveal delay={2}>
              <p className="font-body mt-3 text-sm leading-relaxed text-muted sm:text-base">
                We connect senders, receivers, and station staff in one simple
                flow — so people can pre-book online, drop off with a reference,
                and collect with a pickup code. We are not a transport company;
                partner stations handle the physical journey.
              </p>
            </Reveal>
            <Reveal delay={3}>
              <p className="font-body mt-3 text-sm leading-relaxed text-muted sm:text-base">
                Whether you are sending something home or waiting for a parcel,
                Parcela gives you clear steps and visibility without an account.
              </p>
            </Reveal>
          </div>
          <Reveal delay={1}>
            <div className="relative mx-auto aspect-[4/3] w-full max-w-md overflow-hidden rounded-[1.75rem] shadow-[0_20px_50px_rgb(15_23_42/0.12)] lg:max-w-none">
              <Image
                src="/landing/about-parcels.jpg"
                alt="Organized parcels in a partner logistics facility"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 90vw, 520px"
              />
            </div>
          </Reveal>
        </div>
      </section>

      <section id="faq" className="scroll-mt-20 border-t border-slate-900/5 bg-[#e8eef4]">
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
          <SectionHeading className="text-2xl sm:text-3xl">FAQs</SectionHeading>
          <Reveal delay={1}>
            <p className="font-body mt-3 text-sm leading-relaxed text-muted sm:text-base">
              Quick answers for first-time senders and receivers.
            </p>
          </Reveal>

          <Reveal delay={2}>
            <div className="mt-8 rounded-2xl border border-slate-900/8 bg-white px-5 sm:px-6">
              {FAQS.map((item, index) => (
                <FaqItem
                  key={item.q}
                  question={item.q}
                  answer={item.a}
                  open={openFaq === index}
                  onToggle={() => setOpenFaq(openFaq === index ? null : index)}
                />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-slate-900/5 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row sm:px-8">
          <Logo size="sm" />
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <a href="#partners" className="font-display text-xs font-semibold text-muted hover:text-primary">
              Partners
            </a>
            <a href="#about" className="font-display text-xs font-semibold text-muted hover:text-primary">
              About
            </a>
            <a href="#faq" className="font-display text-xs font-semibold text-muted hover:text-primary">
              FAQs
            </a>
            <Link href="/send" className="font-display text-xs font-semibold text-muted hover:text-primary">
              Send
            </Link>
            <Link href="/track" className="font-display text-xs font-semibold text-muted hover:text-primary">
              Track
            </Link>
          </div>
          <p className="font-body text-center text-xs text-muted sm:text-right">
            Parcela · Partner station parcel booking
          </p>
        </div>
      </footer>
    </div>
  );
}
