import type { Operator } from "@/types/parcel";

/** Only these operators are supported in Parcela for now. */
export const SUPPORTED_OPERATORS = ["VIP", "STC"] as const satisfies readonly Operator[];

export const OPERATOR_LABELS: Record<Operator, string> = {
  VIP: "VIP",
  STC: "STC",
};

export const OPERATOR_LOGOS: Record<Operator, string> = {
  VIP: "/vip.jpg",
  STC: "/stc.png",
};

export const OPERATOR_ACCENT: Record<Operator, string> = {
  VIP: "#DC2626",
  STC: "#065F46",
};

/** Tailwind-friendly badge classes per operator (web UI). */
export const OPERATOR_BADGE_CLASS: Record<Operator, string> = {
  VIP: "bg-red-50 text-red-600",
  STC: "bg-emerald-50 text-emerald-800",
};

export const OPERATOR_FILTER_ACTIVE_CLASS: Record<Operator, string> = {
  VIP: "bg-red-600 text-white shadow-sm",
  STC: "bg-emerald-800 text-white shadow-sm",
};

export const OPERATOR_ICON_CLASS: Record<Operator, { wrapper: string; icon: string }> = {
  VIP: { wrapper: "bg-red-50", icon: "text-red-500" },
  STC: { wrapper: "bg-emerald-50", icon: "text-emerald-700" },
};

export function isSupportedOperator(value: string): value is Operator {
  return SUPPORTED_OPERATORS.includes(value as Operator);
}

export function assertSupportedOperator(value: string): Operator {
  if (!isSupportedOperator(value)) {
    throw new Error(`Operator "${value}" is not supported. Only VIP and STC are accepted.`);
  }
  return value;
}
