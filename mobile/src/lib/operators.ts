import { fetchPublicOperatorBrandingApi, type PublicOperatorBranding } from "@/lib/api";
import type { Operator } from "@/types/parcel";
import { colors } from "@/constants/theme";

export type { PublicOperatorBranding };

/** Parcela app accent — never use operator onboarding colours in the sender UI. */
export const APP_ACCENT = colors.primary;

const FALLBACK_LOGOS: Record<string, number> = {
  VIP: require("../../assets/operators/vip.jpg"),
  STC: require("../../assets/operators/stc.png"),
};

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

export function getOperatorLabel(code: string): string {
  return getOperatorBranding(code)?.name ?? code.trim().toUpperCase();
}

export function getOperatorLogoSource(code: string): number | { uri: string } | null {
  const branding = getOperatorBranding(code);
  if (branding?.logoDataUrl) return { uri: branding.logoDataUrl };
  const fallback = FALLBACK_LOGOS[code.trim().toUpperCase()];
  return fallback ?? null;
}

export function isKnownOperator(code: string): boolean {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return false;
  if (brandingByCode?.has(normalized)) return true;
  return normalized === "VIP" || normalized === "STC";
}

/** @deprecated Use listOperatorFilterOptions() — kept for legacy imports. */
export const SUPPORTED_OPERATORS = ["VIP", "STC"] as const satisfies readonly Operator[];

/** @deprecated Use getOperatorLabel() */
export const OPERATOR_LABELS: Record<string, string> = new Proxy(
  {},
  { get: (_target, prop: string) => getOperatorLabel(prop) },
);

/** @deprecated Use APP_ACCENT / colors.primary in UI */
export const OPERATOR_ACCENT: Record<string, string> = new Proxy(
  {},
  { get: () => APP_ACCENT },
);

export const OPERATOR_LOGOS: Record<string, number> = FALLBACK_LOGOS;

export function listOperatorFilterOptions(
  stationOperators: readonly string[] = [],
): Array<{ code: string; label: string }> {
  const codes = new Set<string>();
  brandingByCode?.forEach((_row, code) => codes.add(code));
  stationOperators.forEach((code) => {
    if (code.trim()) codes.add(code.trim().toUpperCase());
  });
  if (codes.size === 0) {
    codes.add("VIP");
    codes.add("STC");
  }
  return Array.from(codes)
    .sort((a, b) => getOperatorLabel(a).localeCompare(getOperatorLabel(b)))
    .map((code) => ({ code, label: getOperatorLabel(code) }));
}
