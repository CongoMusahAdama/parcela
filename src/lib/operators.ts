import type { Operator } from "@/types/parcel";
import { fetchPublicOperatorBrandingApi, type PublicOperatorBranding } from "@/lib/api";

/** Legacy built-in operators with bundled assets. */
export const SUPPORTED_OPERATORS = ["VIP", "STC"] as const satisfies readonly Operator[];

export const OPERATOR_LABELS: Record<Operator, string> = {
  VIP: "VIP",
  STC: "STC",
};

export const OPERATOR_LOGOS: Record<Operator, string> = {
  VIP: "/vip.jpg",
  STC: "/stc.png",
};

/** Welcome banner backgrounds on staff dashboard */
export const OPERATOR_WELCOME_BG: Record<Operator, string> = {
  VIP: "/sender red.png",
  STC: "/sender.png",
};

/** Booking-confirmed illustration (sender success screen) */
export const OPERATOR_CONFIRMED_ILLUSTRATION: Record<Operator, string> = {
  VIP: "/confrimred.png",
  STC: "/confirmed.jpg",
};

export const OPERATOR_ACCENT: Record<Operator, string> = {
  VIP: "#DC2626",
  STC: "#065F46",
};

export const OPERATOR_REPORT_BRAND: Record<
  Operator,
  { companyName: string; companyTagline: string; accentRgb: [number, number, number] }
> = {
  VIP: {
    companyName: "VIP Transport",
    companyTagline: "VIP terminal parcel operations report",
    accentRgb: [220, 38, 38],
  },
  STC: {
    companyName: "STC Intercity",
    companyTagline: "STC terminal parcel operations report",
    accentRgb: [13, 148, 136],
  },
};

/** Tailwind-friendly badge classes per operator (web UI). */
export const OPERATOR_BADGE_CLASS: Record<Operator, string> = {
  VIP: "bg-red-50 text-red-600",
  STC: "bg-teal-50 text-teal-800",
};

export const OPERATOR_FILTER_ACTIVE_CLASS: Record<Operator, string> = {
  VIP: "bg-red-600 text-white shadow-sm",
  STC: "bg-primary text-white shadow-sm",
};

export const OPERATOR_ICON_CLASS: Record<Operator, { wrapper: string; icon: string }> = {
  VIP: { wrapper: "bg-red-50", icon: "text-red-500" },
  STC: { wrapper: "bg-teal-50", icon: "text-primary" },
};

export function isSupportedOperator(value: string): value is Operator {
  return SUPPORTED_OPERATORS.includes(value as Operator);
}

export function operatorAccentColor(value: string): string {
  const branding = getOperatorBranding(value);
  if (branding?.brandColor?.trim()) return branding.brandColor.trim();
  return isSupportedOperator(value) ? OPERATOR_ACCENT[value] : "#0d9488";
}

export function operatorBadgeClass(value: string): string {
  return isSupportedOperator(value)
    ? OPERATOR_BADGE_CLASS[value]
    : "bg-primary/10 text-primary";
}

export function assertSupportedOperator(value: string): Operator {
  if (!isSupportedOperator(value)) {
    throw new Error(`Operator "${value}" is not supported. Only VIP and STC are accepted.`);
  }
  return value;
}

export function getOperatorConfirmedIllustration(operator: string): string {
  if (isSupportedOperator(operator)) {
    return OPERATOR_CONFIRMED_ILLUSTRATION[operator];
  }
  return OPERATOR_CONFIRMED_ILLUSTRATION.STC;
}

export function getOperatorWelcomeBg(operator: string): string {
  if (isSupportedOperator(operator)) {
    return OPERATOR_WELCOME_BG[operator];
  }
  return OPERATOR_WELCOME_BG.STC;
}

let brandingByCode: Map<string, PublicOperatorBranding> | null = null;
let brandingLoadPromise: Promise<Map<string, PublicOperatorBranding>> | null = null;

function toBrandingMap(rows: PublicOperatorBranding[]) {
  return new Map(rows.map((row) => [row.code.toUpperCase(), row]));
}

export async function ensureOperatorBrandingLoaded(): Promise<Map<string, PublicOperatorBranding>> {
  if (brandingByCode) return brandingByCode;
  if (!brandingLoadPromise) {
    brandingLoadPromise = (async () => {
      try {
        const rows = await fetchPublicOperatorBrandingApi();
        brandingByCode = toBrandingMap(rows);
      } catch {
        brandingByCode = new Map();
      }
      return brandingByCode;
    })().finally(() => {
      brandingLoadPromise = null;
    });
  }
  return brandingLoadPromise;
}

export function getOperatorBranding(code: string): PublicOperatorBranding | undefined {
  return brandingByCode?.get(code.trim().toUpperCase());
}

/** Uploaded brand mark, then legacy VIP/STC assets — same resolution as login + mobile. */
export function getOperatorLogoSrc(code: string): string | null {
  const normalized = code.trim().toUpperCase();
  const branding = getOperatorBranding(normalized);
  if (branding?.logoDataUrl) return branding.logoDataUrl;
  if (isSupportedOperator(normalized)) return OPERATOR_LOGOS[normalized];
  return null;
}

export function getOperatorLabel(code: string): string {
  return getOperatorBranding(code)?.name ?? code.trim().toUpperCase();
}

export function listOperatorFilterOptions(
  stationOperators: readonly string[] = [],
): Array<{ code: string; label: string }> {
  const codes = new Set<string>();
  // Prefer onboarded transports from branding; only include station codes that match branding when loaded.
  if (brandingByCode && brandingByCode.size > 0) {
    brandingByCode.forEach((row, code) => {
      if (row.active !== false) codes.add(code);
    });
  } else {
    stationOperators.forEach((code) => {
      if (code.trim()) codes.add(code.trim().toUpperCase());
    });
  }
  return Array.from(codes)
    .sort((a, b) => getOperatorLabel(a).localeCompare(getOperatorLabel(b)))
    .map((code) => ({ code, label: getOperatorLabel(code) }));
}
