"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bus } from "lucide-react";
import { Reveal } from "@/components/home/Reveal";
import { SectionHeading } from "@/components/home/SectionHeading";
import {
  getOperatorLabel,
  getOperatorLogoSrc,
  operatorAccentColor,
  refreshOperatorBranding,
} from "@/lib/operators";
import type { PublicOperatorBranding } from "@/lib/api";
import { cn } from "@/lib/utils";

type PartnerCard = {
  code: string;
  name: string;
  accent: string;
  logoSrc: string | null;
};

function isLightHex(hex: string): boolean {
  const raw = hex.replace("#", "").trim();
  if (raw.length !== 3 && raw.length !== 6) return false;
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return false;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.65;
}

function PartnerLogo({
  code,
  name,
  accent,
  logoSrc,
}: {
  code: string;
  name: string;
  accent: string;
  logoSrc: string | null;
}) {
  if (logoSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoSrc}
        alt={`${name} logo`}
        className="h-12 w-auto max-w-[9.5rem] object-contain sm:h-14"
      />
    );
  }

  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || code.slice(0, 2);

  const light = isLightHex(accent);

  return (
    <span
      className={cn(
        "font-display flex size-12 items-center justify-center rounded-2xl text-sm font-bold sm:size-14 sm:text-base",
        light ? "text-slate-900" : "text-white",
      )}
      style={{ backgroundColor: accent }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

export function PartnerTransportsSection() {
  const [partners, setPartners] = useState<PartnerCard[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void refreshOperatorBranding().then((map) => {
      if (cancelled) return;
      const rows: PartnerCard[] = Array.from(map.values())
        .filter((row: PublicOperatorBranding) => row.active !== false)
        .map((row) => {
          const code = row.code.trim().toUpperCase();
          return {
            code,
            name: row.name?.trim() || getOperatorLabel(code),
            accent: operatorAccentColor(code),
            logoSrc: getOperatorLogoSrc(code),
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
      setPartners(rows);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = partners === null;
  const empty = partners !== null && partners.length === 0;

  return (
    <section id="partners" className="scroll-mt-20 border-t border-slate-900/5 bg-white">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <SectionHeading className="text-2xl sm:text-3xl">
              Partner transport services
            </SectionHeading>
            <Reveal delay={1}>
              <p className="font-body mt-3 text-sm leading-relaxed text-muted sm:text-base">
                Parcela works with onboarded bus and transport operators. Book
                through their stations — each partner keeps its own brand colour
                and terminals.
              </p>
            </Reveal>
          </div>
          <Reveal delay={2}>
            <Link
              href="/send"
              className="font-display inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              Find a station
              <ArrowRight className="size-4" />
            </Link>
          </Reveal>
        </div>

        {loading ? (
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-[7.5rem] animate-pulse rounded-2xl border border-slate-900/8 bg-slate-100/80"
              />
            ))}
          </div>
        ) : empty ? (
          <Reveal>
            <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-slate-900/15 bg-[#f4f7fb] px-6 py-12 text-center">
              <Bus className="size-8 text-primary/50" />
              <p className="font-display mt-3 text-base font-bold text-foreground">
                Partners coming soon
              </p>
              <p className="font-body mt-1 max-w-sm text-sm text-muted">
                Transport services will appear here as they are onboarded onto
                Parcela.
              </p>
            </div>
          </Reveal>
        ) : (
          <ul
            className={cn(
              "mt-10 grid gap-3",
              partners.length === 1
                ? "max-w-md sm:grid-cols-1"
                : partners.length === 2
                  ? "sm:grid-cols-2"
                  : "sm:grid-cols-2 lg:grid-cols-3",
            )}
          >
            {partners.map((partner, index) => (
              <Reveal key={partner.code} delay={(Math.min(index, 2) + 1) as 1 | 2 | 3}>
                <li>
                  <Link
                    href={`/send?operator=${encodeURIComponent(partner.code)}`}
                    className="group relative flex h-full items-center gap-4 overflow-hidden rounded-2xl border border-slate-900/8 bg-[#f8fafc] px-5 py-5 transition-all hover:-translate-y-0.5 hover:border-transparent hover:shadow-[0_16px_40px_rgb(15_23_42/0.1)]"
                  >
                    <span
                      className="absolute inset-y-0 left-0 w-1.5"
                      style={{ backgroundColor: partner.accent }}
                      aria-hidden
                    />
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5">
                      <PartnerLogo
                        code={partner.code}
                        name={partner.name}
                        accent={partner.accent}
                        logoSrc={partner.logoSrc}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display truncate text-base font-bold text-foreground">
                        {partner.name}
                      </p>
                      <p className="font-body mt-0.5 text-xs text-muted">
                        Partner transport · send via their stations
                      </p>
                      <span
                        className="font-display mt-2 inline-flex items-center gap-1 text-xs font-semibold"
                        style={{ color: partner.accent }}
                      >
                        Book with {partner.code}
                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                </li>
              </Reveal>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
