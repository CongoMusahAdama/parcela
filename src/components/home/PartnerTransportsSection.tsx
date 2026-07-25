"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, Bus } from "lucide-react";
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

function PartnerMark({
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
        className="max-h-10 w-auto max-w-[8.5rem] object-contain opacity-80 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0 sm:max-h-11"
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
        "font-display flex h-10 min-w-[4.5rem] items-center justify-center rounded-lg px-3 text-sm font-bold tracking-wide opacity-80 transition group-hover:opacity-100 sm:h-11",
        light ? "text-slate-900" : "text-white",
      )}
      style={{ backgroundColor: accent }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

function PartnerCarouselTrack({ partners }: { partners: PartnerCard[] }) {
  // Duplicate for seamless infinite scroll when there are enough logos
  const loop = partners.length > 1 ? [...partners, ...partners] : partners;
  const durationSec = Math.max(18, partners.length * 6);

  return (
    <div className="partner-carousel relative mt-10 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#f7f8fa] to-transparent sm:w-20"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#f7f8fa] to-transparent sm:w-20"
        aria-hidden
      />

      <div
        className={cn(
          "partner-carousel-track flex w-max items-center gap-10 sm:gap-14",
          partners.length > 1 && "partner-carousel-track--animate",
        )}
        style={
          partners.length > 1
            ? ({ ["--partner-carousel-duration"]: `${durationSec}s` } as CSSProperties)
            : undefined
        }
      >
        {loop.map((partner, index) => (
          <Link
            key={`${partner.code}-${index}`}
            href={`/send?operator=${encodeURIComponent(partner.code)}`}
            className="group flex shrink-0 items-center justify-center"
            title={partner.name}
            aria-label={`Book with ${partner.name}`}
          >
            <PartnerMark
              code={partner.code}
              name={partner.name}
              accent={partner.accent}
              logoSrc={partner.logoSrc}
            />
          </Link>
        ))}
      </div>
    </div>
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

  return (
    <section id="partners" className="scroll-mt-20 bg-[#f7f8fa]">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">
              Partner transports
            </h2>
            <p className="font-body mt-2 text-sm leading-relaxed text-muted sm:text-[15px]">
              Book through onboarded operators across Ghana — each keeps its brand
              and station network.
            </p>
          </div>
          <Link
            href="/send"
            className="font-display inline-flex shrink-0 items-center gap-1.5 pt-1 text-sm font-semibold text-foreground transition hover:text-primary"
          >
            Show all partners
            <ArrowRight className="size-4" strokeWidth={2.25} />
          </Link>
        </div>

        {loading ? (
          <div className="mt-10 flex items-center gap-10 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-10 w-28 shrink-0 animate-pulse rounded-lg bg-slate-200/80"
              />
            ))}
          </div>
        ) : empty ? (
          <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-slate-900/12 bg-white px-6 py-12 text-center">
            <Bus className="size-8 text-primary/50" />
            <p className="font-display mt-3 text-base font-bold text-foreground">
              Partners coming soon
            </p>
            <p className="font-body mt-1 max-w-sm text-sm text-muted">
              Transport services will appear here as they are onboarded onto
              Parcela.
            </p>
          </div>
        ) : (
          <PartnerCarouselTrack partners={partners} />
        )}
      </div>
    </section>
  );
}
