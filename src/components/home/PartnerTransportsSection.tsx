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

/** API names are often ALL CAPS — present them as readable title case. */
function formatPartnerName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (!trimmed) return trimmed;
  const letters = trimmed.replace(/[^A-Za-z]/g, "");
  if (letters.length > 2 && letters === letters.toUpperCase()) {
    return trimmed
      .toLowerCase()
      .replace(/\b([a-z])/g, (m) => m.toUpperCase());
  }
  return trimmed;
}

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
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62;
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
        className="max-h-14 w-auto max-w-[11rem] object-contain sm:max-h-16"
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
        "font-display flex size-14 items-center justify-center rounded-2xl text-base font-bold sm:size-16 sm:text-lg",
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
            name: formatPartnerName(row.name?.trim() || getOperatorLabel(code)),
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
  const single = partners?.length === 1;

  return (
    <section
      id="partners"
      className="scroll-mt-20 border-t border-slate-900/5 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_42%,#ffffff_100%)]"
    >
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <SectionHeading className="text-2xl sm:text-3xl">
              Partner transport services
            </SectionHeading>
            <Reveal delay={1}>
              <p className="font-body mt-3 text-sm leading-relaxed text-muted sm:text-base">
                Book through onboarded operators. Each partner keeps its brand,
                colours, and station network.
              </p>
            </Reveal>
          </div>
          <Reveal delay={2}>
            <Link
              href="/send"
              className="font-display inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              Browse all stations
              <ArrowRight className="size-4" />
            </Link>
          </Reveal>
        </div>

        {loading ? (
          <div
            className={cn(
              "mt-10 grid gap-4",
              "sm:grid-cols-2 lg:grid-cols-3",
            )}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-56 animate-pulse rounded-3xl border border-slate-900/8 bg-slate-100/80"
              />
            ))}
          </div>
        ) : empty ? (
          <Reveal>
            <div className="mt-10 flex flex-col items-center rounded-3xl border border-dashed border-slate-900/15 bg-white px-6 py-14 text-center">
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
              "mt-10 grid gap-4",
              single
                ? "mx-auto max-w-lg"
                : partners.length === 2
                  ? "sm:grid-cols-2"
                  : "sm:grid-cols-2 lg:grid-cols-3",
            )}
          >
            {partners.map((partner, index) => {
              const lightAccent = isLightHex(partner.accent);
              return (
                <Reveal
                  key={partner.code}
                  delay={(Math.min(index, 2) + 1) as 1 | 2 | 3}
                >
                  <li className="h-full">
                    <Link
                      href={`/send?operator=${encodeURIComponent(partner.code)}`}
                      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-900/8 bg-white shadow-[0_1px_0_rgb(15_23_42/0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-slate-900/10 hover:shadow-[0_22px_50px_-28px_rgb(15_23_42/0.35)]"
                    >
                      <div
                        className="relative flex min-h-[7.5rem] items-center justify-center px-6 py-7"
                        style={{
                          background: `linear-gradient(145deg, ${partner.accent}18 0%, ${partner.accent}08 48%, #ffffff 100%)`,
                        }}
                      >
                        <span
                          className="absolute inset-x-0 top-0 h-1"
                          style={{ backgroundColor: partner.accent }}
                          aria-hidden
                        />
                        <div className="flex min-h-[4.5rem] w-full items-center justify-center rounded-2xl bg-white/90 px-5 py-4 shadow-sm ring-1 ring-slate-900/6 backdrop-blur-sm">
                          <PartnerLogo
                            code={partner.code}
                            name={partner.name}
                            accent={partner.accent}
                            logoSrc={partner.logoSrc}
                          />
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
                        <p className="font-display text-[0.65rem] font-bold uppercase tracking-[0.16em] text-muted">
                          Partner · {partner.code}
                        </p>
                        <h3 className="font-display mt-1.5 text-lg font-bold leading-snug tracking-tight text-foreground sm:text-xl">
                          {partner.name}
                        </h3>
                        <p className="font-body mt-2 text-sm leading-relaxed text-muted">
                          Send parcels through their stations — same network your
                          booking travels on.
                        </p>
                        <span
                          className={cn(
                            "font-display mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-transform group-hover:translate-y-[-1px]",
                            lightAccent ? "text-slate-900" : "text-white",
                          )}
                          style={{ backgroundColor: partner.accent }}
                        >
                          Book with {partner.code}
                          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </Link>
                  </li>
                </Reveal>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
