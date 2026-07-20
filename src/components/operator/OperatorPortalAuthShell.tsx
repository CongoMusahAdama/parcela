"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  BarChart3,
  Building2,
  Bus,
  Database,
  MapPin,
  Network,
  PackageCheck,
  Settings,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ServerConfigurationModal } from "@/components/auth/ServerConfigurationModal";
import {
  getStoredTransportName,
  isServerConfigured,
  clearInvalidStoredApiBaseUrl,
} from "@/lib/api-server-config";
import type { LoginOperatorBrand } from "@/lib/login-brand";
import { loginBrandLogoSrc } from "@/lib/login-brand";
import { platformThemeStyle, PLATFORM_THEME } from "@/lib/platform-theme";
import { cn } from "@/lib/utils";

export type PortalAuthMode = "staff" | "lead" | "hq";

const STAFF_FEATURES = [
  { icon: PackageCheck, text: "Verify drop-offs" },
  { icon: Bus, text: "Log & track parcels" },
  { icon: ShieldCheck, text: "Release with pickup code" },
] as const;

const LEAD_FEATURES = [
  { icon: Users, text: "Manage counter staff" },
  { icon: PackageCheck, text: "Branch parcel overview" },
  { icon: BarChart3, text: "Reports & analytics" },
] as const;

const HQ_FEATURES = [
  { icon: Network, text: "All branches, one view" },
  { icon: Building2, text: "Configure your transport network" },
  { icon: Settings, text: "Assign branch leads & stations" },
  { icon: Shield, text: "Operator-wide controls" },
] as const;

type OperatorPortalAuthShellProps = {
  mode: PortalAuthMode;
  brand?: LoginOperatorBrand | null;
  brandLoading?: boolean;
  loading?: boolean;
  children: ReactNode;
  /** After transport name save — refresh logo/company without reloading the page. */
  onServerConfigured?: (
    transportName: string,
    brand: LoginOperatorBrand | null,
  ) => void | Promise<void>;
};

function TransportCompanyOnForm({
  brand,
  loading,
}: {
  brand: LoginOperatorBrand | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="mb-5 flex flex-col items-center text-center">
        <div className="size-14 animate-pulse rounded-2xl bg-slate-200" aria-hidden />
        <div className="mt-2.5 h-3.5 w-40 animate-pulse rounded bg-slate-200" aria-hidden />
        <p className="font-body mt-1.5 text-[11px] text-slate-400">Loading transport…</p>
      </div>
    );
  }

  if (!brand?.found) {
    return (
      <div className="mb-5 flex flex-col items-center text-center">
        <Logo size="lg" className="justify-center" />
        <p className="font-body mt-2 text-[11px] text-slate-400">
          {isServerConfigured()
            ? "Loading your transport company…"
            : "Add your transport name below to load the company logo"}
        </p>
      </div>
    );
  }

  const logoSrc = loginBrandLogoSrc(brand);

  return (
    <div className="mb-5 flex flex-col items-center text-center">
      {logoSrc ? (
        <div className="flex size-16 items-center justify-center rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-200/80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt={brand.operatorName ?? "Transport"}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      ) : (
        <div
          className="flex size-16 items-center justify-center rounded-2xl text-base font-bold text-white"
          style={{ background: PLATFORM_THEME.headerGradient }}
          aria-hidden
        >
          {(brand.operatorCode ?? "TS").slice(0, 2)}
        </div>
      )}
      <h2 className="font-display mt-2.5 max-w-[18rem] text-sm font-bold uppercase leading-snug tracking-wide text-slate-900">
        {brand.operatorName ?? "Transport service"}
      </h2>
      {brand.stationName ? (
        <p className="font-body mt-1 flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <MapPin className="size-3.5 shrink-0 text-[#1e3a5f]" />
          <span className="font-semibold text-slate-700">{brand.stationName}</span>
        </p>
      ) : null}
      <p className="font-body mt-1 text-[10px] uppercase tracking-[0.14em] text-slate-400">
        Powered by Parcela
      </p>
    </div>
  );
}

function panelCopy(mode: PortalAuthMode) {
  if (mode === "hq") {
    return {
      portalLabel: "Headquarters portal",
      eyebrow: "Parcela HQ",
      title: "Your network.",
      subtitle: "One HQ dashboard.",
      body: "Add your transport name once, then sign in. We load that company’s logo on this form.",
      footer: "Headquarters access · Provisioned by Parcela",
      features: HQ_FEATURES,
    };
  }
  if (mode === "lead") {
    return {
      portalLabel: "Branch lead portal",
      eyebrow: "Parcela operations",
      title: "Lead your branch.",
      subtitle: "Staff & parcels in one place.",
      body: "Add your transport name once, then sign in. We load that company’s logo and station details on this form.",
      footer: "Branch lead sign-in · Branch-scoped access",
      features: LEAD_FEATURES,
    };
  }
  return {
    portalLabel: "Station staff portal",
    eyebrow: "Parcela operations",
    title: "Run your terminal.",
    subtitle: "Parcel ops made simple.",
    body: "Add your transport name once, then sign in. We load that company’s logo and station details on this form.",
    footer: "Counter sign-in · Station-scoped access",
    features: STAFF_FEATURES,
  };
}

export function OperatorPortalAuthShell({
  mode,
  brand = null,
  brandLoading = false,
  loading = false,
  children,
  onServerConfigured,
}: OperatorPortalAuthShellProps) {
  const copy = panelCopy(mode);
  const [serverOpen, setServerOpen] = useState(false);
  const [transportName, setTransportName] = useState<string | null>(null);
  const [serverReady, setServerReady] = useState(false);

  useEffect(() => {
    clearInvalidStoredApiBaseUrl();
    const name = getStoredTransportName();
    setTransportName(name);
    setServerReady(Boolean(name));
  }, []);

  async function handleServerSaved(name: string, nextBrand: LoginOperatorBrand | null) {
    const cleaned = name.trim() || null;
    setTransportName(cleaned);
    setServerReady(Boolean(cleaned));
    await onServerConfigured?.(name, nextBrand);
  }

  return (
    <div
      className="flex min-h-dvh items-center justify-center px-3 py-4 sm:px-6 sm:py-6"
      style={{ ...platformThemeStyle(), background: "#e8eef5" }}
    >
      <div className="flex w-full max-w-[1080px] flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_28px_72px_-20px_rgb(15_23_42_/_0.28)] lg:min-h-[720px] lg:flex-row">
        <section className="relative flex flex-1 flex-col justify-center px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12 xl:px-14">
          <div className="mx-auto w-full max-w-[400px]">
            {loading ? (
              <p className="font-body text-sm text-slate-500">Checking session…</p>
            ) : (
              <>
                <TransportCompanyOnForm brand={brand} loading={brandLoading} />
                {children}
                <div className="mt-6 border-t border-slate-100 pt-4 text-center">
                  {serverReady && transportName ? (
                    <>
                      <p className="font-body text-[11px] font-semibold text-emerald-700">
                        Transport connected
                      </p>
                      <p className="font-body mt-1 text-[10px] text-slate-400">
                        <span className="font-mono font-semibold text-slate-600">{transportName}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => setServerOpen(true)}
                        className="font-display mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#1e3a5f] hover:underline"
                      >
                        <Database className="size-3" />
                        Edit / change transport
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setServerOpen(true)}
                        className="font-display inline-flex items-center gap-2 text-sm font-bold text-[#1e3a5f] hover:underline"
                      >
                        <Database className="size-3.5" />
                        Add transport / database
                      </button>
                      <p className="font-body mt-1.5 text-[10px] text-slate-400">
                        Enter the transport name (e.g. MMT) to load company logo
                      </p>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        <aside
          className={cn(
            "relative hidden overflow-hidden text-white lg:flex lg:w-[46%] lg:shrink-0 lg:flex-col",
            "operator-auth-curve",
          )}
          style={{ background: PLATFORM_THEME.headerGradient }}
        >
          <div
            className="pointer-events-none absolute -left-10 top-1/2 size-[28rem] -translate-y-1/2 rounded-full bg-white/5 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-3xl"
            aria-hidden
          />

          <div className="relative z-10 flex h-full min-h-[720px] flex-col px-9 py-11 xl:px-11 xl:py-12">
            <div className="shrink-0">
              <Logo
                size="lg"
                className="[&_span]:text-white [&_img]:brightness-0 [&_img]:invert"
              />
              <p className="font-body mt-2 text-xs font-medium tracking-wide text-white/70">
                {copy.portalLabel}
              </p>
            </div>

            <div className="my-8 flex flex-1 flex-col justify-center">
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-white/65">
                {copy.eyebrow}
              </p>
              <h1 className="font-display mt-3 text-[1.85rem] font-bold leading-tight tracking-tight text-white xl:text-[2.1rem]">
                {copy.title}
                <br />
                <span className="text-white/90">{copy.subtitle}</span>
              </h1>
              <p className="font-body mt-4 max-w-sm text-sm leading-relaxed text-white/85">
                {copy.body}
              </p>

              <ul className="mt-8 space-y-3">
                {copy.features.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-white backdrop-blur-sm">
                      <Icon className="size-4" strokeWidth={2.25} />
                    </span>
                    <p className="font-display text-sm font-semibold text-white">{text}</p>
                  </li>
                ))}
              </ul>
            </div>

            <p className="font-body mt-auto flex items-center gap-2 text-xs text-white/65">
              <MapPin className="size-3.5 shrink-0" />
              {copy.footer}
            </p>
          </div>
        </aside>
      </div>

      <ServerConfigurationModal
        open={serverOpen}
        onClose={() => setServerOpen(false)}
        onSaved={handleServerSaved}
      />
    </div>
  );
}
